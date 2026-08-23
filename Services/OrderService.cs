using Microsoft.EntityFrameworkCore;
using System.Data;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Models.Realtime;

namespace TerraVision.Api.Services
{
    public class OrderService : IOrderService
    {
        private readonly TerraVisionDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRealtimeSyncService _realtimeSyncService;
        private readonly ICareService _careService;
        private readonly INotificationService _notificationService;

        public OrderService(
            TerraVisionDbContext dbContext,
            IUnitOfWork unitOfWork,
            IRealtimeSyncService realtimeSyncService,
            ICareService careService,
            INotificationService notificationService)
        {
            _dbContext = dbContext;
            _unitOfWork = unitOfWork;
            _realtimeSyncService = realtimeSyncService;
            _careService = careService;
            _notificationService = notificationService;
        }

        public async Task<OrderDto> PlaceOrderFromCartAsync(int userId, PlaceOrderRequest request)
        {
            await using var transaction = _dbContext.Database.IsRelational()
                ? await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable)
                : null;

            var cart = await _dbContext.Carts.SingleOrDefaultAsync(c => c.UserId == userId && !c.IsDeleted);
            if (cart == null)
            {
                throw new InvalidOperationException("Cart not found.");
            }

            var cartItems = await _dbContext.CartItems
                .Where(ci => ci.CartId == cart.Id && !ci.IsDeleted)
                .Join(_dbContext.Products,
                    ci => ci.ProductId,
                    p => p.Id,
                    (ci, p) => new { CartItem = ci, Product = p })
                .ToListAsync();

            if (cartItems.Count == 0)
            {
                throw new InvalidOperationException("Cart is empty.");
            }

            foreach (var item in cartItems)
            {
                if (item.CartItem.Quantity <= 0)
                {
                    throw new InvalidOperationException($"Invalid quantity for product: {item.Product.Name}");
                }

                if (item.Product.StockQuantity < item.CartItem.Quantity)
                {
                    throw new InvalidOperationException($"Insufficient stock for product: {item.Product.Name}");
                }
            }

            var notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

            var order = new Order
            {
                UserId = userId,
                TotalAmount = cartItems.Sum(x => x.Product.Price * x.CartItem.Quantity),
                Notes = notes
            };

            await _dbContext.Orders.AddAsync(order);

            var lowStockEvents = new List<ProductLowStockEvent>();

            foreach (var item in cartItems)
            {
                await _dbContext.OrderItems.AddAsync(new OrderItem
                {
                    Order = order,
                    ProductId = item.Product.Id,
                    UnitPrice = item.Product.Price,
                    Quantity = item.CartItem.Quantity
                });

                var previousStock = item.Product.StockQuantity;
                item.Product.StockQuantity -= item.CartItem.Quantity;
                item.Product.UpdatedDate = DateTime.UtcNow;

                if (ProductStockAlertEvaluator.ShouldNotify(item.Product, previousStock))
                {
                    lowStockEvents.Add(new ProductLowStockEvent
                    {
                        ProductId = item.Product.Id,
                        ProductName = item.Product.Name,
                        StockQuantity = item.Product.StockQuantity,
                        MinStockLevel = item.Product.MinStockLevel,
                        Message = ProductStockAlertEvaluator.BuildMessage(
                            item.Product.Name,
                            item.Product.StockQuantity,
                            item.Product.MinStockLevel),
                        OccurredAtUtc = DateTime.UtcNow
                    });
                }

                item.CartItem.IsDeleted = true;
                item.CartItem.UpdatedDate = DateTime.UtcNow;
            }

            await _unitOfWork.CommitAsync();
            if (transaction != null)
            {
                await transaction.CommitAsync();
            }

            await _realtimeSyncService.BroadcastOrderCreatedAsync(new OrderCreatedEvent
            {
                UserId = userId,
                OrderId = order.Id,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                OccurredAtUtc = DateTime.UtcNow
            });

            foreach (var lowStockEvent in lowStockEvents)
            {
                await _realtimeSyncService.BroadcastProductLowStockAsync(lowStockEvent);
            }

            await _notificationService.CreateAsync(
                userId,
                NotificationType.OrderCreated,
                "Siparişiniz alındı",
                $"#{order.Id} numaralı siparişiniz oluşturuldu. Toplam tutar: {order.TotalAmount:N2} ₺.",
                relatedEntityType: "Order",
                relatedEntityId: order.Id);

            return await GetMyOrderByIdAsync(userId, order.Id);
        }

        public async Task<IEnumerable<OrderDto>> GetMyOrdersAsync(int userId)
        {
            var orders = await _dbContext.Orders
                .Where(o => o.UserId == userId && !o.IsDeleted)
                .OrderByDescending(o => o.CreatedDate)
                .ToListAsync();

            var orderIds = orders.Select(o => o.Id).ToList();
            var itemRows = await _dbContext.OrderItems
                .Where(oi => orderIds.Contains(oi.OrderId) && !oi.IsDeleted)
                .Join(_dbContext.Products,
                    oi => oi.ProductId,
                    p => p.Id,
                    (oi, p) => new
                    {
                        oi.OrderId,
                        Item = new OrderItemDto
                        {
                            ProductId = p.Id,
                            ProductName = p.Name,
                            UnitPrice = oi.UnitPrice,
                            Quantity = oi.Quantity
                        }
                    })
                .ToListAsync();

            return orders.Select(order => new OrderDto
            {
                Id = order.Id,
                UserId = order.UserId,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                Notes = order.Notes,
                CreatedDate = order.CreatedDate,
                UpdatedByUserId = order.UpdatedByUserId,
                UpdatedReason = order.UpdatedReason,
                Items = itemRows.Where(x => x.OrderId == order.Id).Select(x => x.Item).ToList(),
                StatusHistory = []
            });
        }

        public async Task<PagedResult<OrderDto>> GetAllOrdersAsync(AdminOrderListQuery query)
        {
            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize is < 1 or > 100 ? 20 : query.PageSize;

            var baseQuery = _dbContext.Orders
                .Where(o => !o.IsDeleted);

            if (query.Status.HasValue)
            {
                baseQuery = baseQuery.Where(o => o.Status == query.Status.Value);
            }

            if (query.OrderId.HasValue)
            {
                baseQuery = baseQuery.Where(o => o.Id == query.OrderId.Value);
            }

            if (query.RangeDays.HasValue && query.RangeDays.Value > 0)
            {
                if (query.RangeDays.Value == 1)
                {
                    var todayUtc = DateTime.UtcNow.Date;
                    var tomorrowUtc = todayUtc.AddDays(1);
                    baseQuery = baseQuery.Where(o => o.CreatedDate >= todayUtc && o.CreatedDate < tomorrowUtc);
                }
                else
                {
                    var fromUtc = DateTime.UtcNow.AddDays(-query.RangeDays.Value);
                    baseQuery = baseQuery.Where(o => o.CreatedDate >= fromUtc);
                }
            }

            var totalCount = await baseQuery.CountAsync();
            var orders = await baseQuery
                .OrderByDescending(o => o.CreatedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var orderIds = orders.Select(o => o.Id).ToList();
            var itemRows = await _dbContext.OrderItems
                .Where(oi => orderIds.Contains(oi.OrderId) && !oi.IsDeleted)
                .Join(_dbContext.Products,
                    oi => oi.ProductId,
                    p => p.Id,
                    (oi, p) => new
                    {
                        oi.OrderId,
                        Item = new OrderItemDto
                        {
                            ProductId = p.Id,
                            ProductName = p.Name,
                            UnitPrice = oi.UnitPrice,
                            Quantity = oi.Quantity
                        }
                    })
                .ToListAsync();

            var mappedItems = orders.Select(order => new OrderDto
            {
                Id = order.Id,
                UserId = order.UserId,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                Notes = order.Notes,
                CreatedDate = order.CreatedDate,
                UpdatedByUserId = order.UpdatedByUserId,
                UpdatedReason = order.UpdatedReason,
                Items = itemRows.Where(x => x.OrderId == order.Id).Select(x => x.Item).ToList(),
                StatusHistory = []
            }).ToList();

            return new PagedResult<OrderDto>
            {
                Items = mappedItems,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<OrderDto> GetMyOrderByIdAsync(int userId, int orderId)
        {
            var order = await _dbContext.Orders
                .SingleOrDefaultAsync(o => o.Id == orderId && o.UserId == userId && !o.IsDeleted);
            if (order == null)
            {
                throw new KeyNotFoundException("Order not found.");
            }

            var items = await _dbContext.OrderItems
                .Where(oi => oi.OrderId == order.Id && !oi.IsDeleted)
                .Join(_dbContext.Products,
                    oi => oi.ProductId,
                    p => p.Id,
                    (oi, p) => new OrderItemDto
                    {
                        ProductId = p.Id,
                        ProductName = p.Name,
                        UnitPrice = oi.UnitPrice,
                        Quantity = oi.Quantity
                    })
                .ToListAsync();

            var history = await _dbContext.OrderStatusHistories
                .Where(h => h.OrderId == order.Id && !h.IsDeleted)
                .OrderByDescending(h => h.CreatedDate)
                .Select(h => new OrderStatusHistoryDto
                {
                    PreviousStatus = h.PreviousStatus,
                    NewStatus = h.NewStatus,
                    ChangedByUserId = h.ChangedByUserId,
                    Reason = h.Reason,
                    OccurredAtUtc = h.CreatedDate
                })
                .ToListAsync();

            return new OrderDto
            {
                Id = order.Id,
                UserId = order.UserId,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                Notes = order.Notes,
                CreatedDate = order.CreatedDate,
                UpdatedByUserId = order.UpdatedByUserId,
                UpdatedReason = order.UpdatedReason,
                Items = items,
                StatusHistory = history
            };
        }

        public async Task<OrderDto> UpdateOrderStatusAsync(int orderId, int updatedByUserId, UpdateOrderStatusRequest request)
        {
            if (request.Status == OrderStatus.Cancelled && string.IsNullOrWhiteSpace(request.Reason))
            {
                throw new ArgumentException("Reason is required when cancelling an order.");
            }

            var order = await _dbContext.Orders
                .SingleOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted);
            if (order == null)
            {
                throw new KeyNotFoundException("Order not found.");
            }

            var previousStatus = order.Status;
            if (!IsStatusTransitionAllowed(previousStatus, request.Status))
            {
                throw new InvalidOperationException($"Invalid status transition: {previousStatus} -> {request.Status}");
            }

            order.Status = request.Status;
            order.UpdatedByUserId = updatedByUserId;
            order.UpdatedReason = request.Reason;
            order.UpdatedDate = DateTime.UtcNow;

            if (previousStatus != request.Status)
            {
                await _dbContext.OrderStatusHistories.AddAsync(new OrderStatusHistory
                {
                    OrderId = order.Id,
                    PreviousStatus = previousStatus,
                    NewStatus = request.Status,
                    ChangedByUserId = updatedByUserId,
                    Reason = request.Reason,
                    CreatedDate = DateTime.UtcNow
                });
            }

            if (previousStatus != request.Status && request.Status == OrderStatus.Delivered)
            {
                await _careService.ProvisionCalendarsForDeliveredOrderAsync(order.Id);
            }

            if (previousStatus != request.Status && request.Status == OrderStatus.Cancelled)
            {
                await RestockOrderItemsAsync(order.Id);
            }

            await _unitOfWork.CommitAsync();

            await _realtimeSyncService.BroadcastOrderStatusChangedAsync(new OrderStatusChangedEvent
            {
                UserId = order.UserId,
                OrderId = order.Id,
                PreviousStatus = previousStatus,
                NewStatus = order.Status,
                UpdatedByUserId = updatedByUserId,
                UpdatedReason = request.Reason,
                OccurredAtUtc = DateTime.UtcNow
            });

            if (previousStatus != order.Status)
            {
                var statusMessage = $"#{order.Id} numaralı siparişinizin durumu \"{DescribeOrderStatus(order.Status)}\" olarak güncellendi.";
                if (!string.IsNullOrWhiteSpace(request.Reason))
                {
                    statusMessage += $" Açıklama: {request.Reason.Trim()}";
                }

                await _notificationService.CreateAsync(
                    order.UserId,
                    NotificationType.OrderStatusChanged,
                    "Sipariş durumu güncellendi",
                    statusMessage,
                    relatedEntityType: "Order",
                    relatedEntityId: order.Id);
            }

            var items = await _dbContext.OrderItems
                .Where(oi => oi.OrderId == order.Id && !oi.IsDeleted)
                .Join(_dbContext.Products,
                    oi => oi.ProductId,
                    p => p.Id,
                    (oi, p) => new OrderItemDto
                    {
                        ProductId = p.Id,
                        ProductName = p.Name,
                        UnitPrice = oi.UnitPrice,
                        Quantity = oi.Quantity
                    })
                .ToListAsync();

            var history = await _dbContext.OrderStatusHistories
                .Where(h => h.OrderId == order.Id && !h.IsDeleted)
                .OrderByDescending(h => h.CreatedDate)
                .Select(h => new OrderStatusHistoryDto
                {
                    PreviousStatus = h.PreviousStatus,
                    NewStatus = h.NewStatus,
                    ChangedByUserId = h.ChangedByUserId,
                    Reason = h.Reason,
                    OccurredAtUtc = h.CreatedDate
                })
                .ToListAsync();

            return new OrderDto
            {
                Id = order.Id,
                UserId = order.UserId,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                Notes = order.Notes,
                CreatedDate = order.CreatedDate,
                UpdatedByUserId = order.UpdatedByUserId,
                UpdatedReason = order.UpdatedReason,
                Items = items,
                StatusHistory = history
            };
        }

        private async Task RestockOrderItemsAsync(int orderId)
        {
            var items = await _dbContext.OrderItems
                .Where(oi => oi.OrderId == orderId && !oi.IsDeleted)
                .ToListAsync();

            if (items.Count == 0)
            {
                return;
            }

            var productIds = items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _dbContext.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            var now = DateTime.UtcNow;
            foreach (var item in items)
            {
                if (!products.TryGetValue(item.ProductId, out var product))
                {
                    continue;
                }

                product.StockQuantity += item.Quantity;
                product.UpdatedDate = now;
            }
        }

        private static string DescribeOrderStatus(OrderStatus status) => status switch
        {
            OrderStatus.Pending => "Beklemede",
            OrderStatus.Confirmed => "Onaylandı",
            OrderStatus.Shipped => "Kargoya verildi",
            OrderStatus.Delivered => "Teslim edildi",
            OrderStatus.Cancelled => "İptal edildi",
            _ => status.ToString()
        };

        private static bool IsStatusTransitionAllowed(OrderStatus current, OrderStatus next)
        {
            if (current == next)
            {
                return true;
            }

            return current switch
            {
                OrderStatus.Pending => next is OrderStatus.Confirmed or OrderStatus.Cancelled,
                OrderStatus.Confirmed => next is OrderStatus.Shipped or OrderStatus.Cancelled,
                OrderStatus.Shipped => next is OrderStatus.Delivered,
                OrderStatus.Delivered => false,
                OrderStatus.Cancelled => false,
                _ => false
            };
        }
    }
}
