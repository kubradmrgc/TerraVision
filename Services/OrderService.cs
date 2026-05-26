using Microsoft.EntityFrameworkCore;
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

        public OrderService(
            TerraVisionDbContext dbContext,
            IUnitOfWork unitOfWork,
            IRealtimeSyncService realtimeSyncService)
        {
            _dbContext = dbContext;
            _unitOfWork = unitOfWork;
            _realtimeSyncService = realtimeSyncService;
        }

        public async Task<OrderDto> PlaceOrderFromCartAsync(int userId, PlaceOrderRequest request)
        {
            await using var transaction = await _dbContext.Database.BeginTransactionAsync();

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
                if (item.Product.StockQuantity < item.CartItem.Quantity)
                {
                    throw new InvalidOperationException($"Insufficient stock for product: {item.Product.Name}");
                }
            }

            var now = DateTime.UtcNow;
            foreach (var item in cartItems)
            {
                var claimedCartItemCount = await _dbContext.CartItems
                    .Where(ci => ci.Id == item.CartItem.Id &&
                                 !ci.IsDeleted &&
                                 ci.Quantity == item.CartItem.Quantity)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(ci => ci.IsDeleted, true)
                        .SetProperty(ci => ci.UpdatedDate, now));

                if (claimedCartItemCount != 1)
                {
                    throw new InvalidOperationException("Cart changed during checkout. Please review your cart and try again.");
                }
            }

            foreach (var item in cartItems)
            {
                var updatedStockCount = await _dbContext.Products
                    .Where(p => p.Id == item.Product.Id &&
                                !p.IsDeleted &&
                                p.IsActive &&
                                p.StockQuantity >= item.CartItem.Quantity)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(p => p.StockQuantity, p => p.StockQuantity - item.CartItem.Quantity)
                        .SetProperty(p => p.UpdatedDate, now));

                if (updatedStockCount != 1)
                {
                    throw new InvalidOperationException($"Insufficient stock for product: {item.Product.Name}");
                }
            }

            var order = new Order
            {
                UserId = userId,
                TotalAmount = cartItems.Sum(x => x.Product.Price * x.CartItem.Quantity),
                Items = cartItems.Select(item => new OrderItem
                {
                    ProductId = item.Product.Id,
                    UnitPrice = item.Product.Price,
                    Quantity = item.CartItem.Quantity
                }).ToList()
            };

            await _dbContext.Orders.AddAsync(order);
            await _unitOfWork.CommitAsync();
            await transaction.CommitAsync();

            await _realtimeSyncService.BroadcastOrderCreatedAsync(new OrderCreatedEvent
            {
                UserId = userId,
                OrderId = order.Id,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                OccurredAtUtc = DateTime.UtcNow
            });

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
                CreatedDate = order.CreatedDate,
                UpdatedByUserId = order.UpdatedByUserId,
                UpdatedReason = order.UpdatedReason,
                Items = itemRows.Where(x => x.OrderId == order.Id).Select(x => x.Item).ToList()
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
                CreatedDate = order.CreatedDate,
                UpdatedByUserId = order.UpdatedByUserId,
                UpdatedReason = order.UpdatedReason,
                Items = itemRows.Where(x => x.OrderId == order.Id).Select(x => x.Item).ToList()
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

            return new OrderDto
            {
                Id = order.Id,
                UserId = order.UserId,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                CreatedDate = order.CreatedDate,
                UpdatedByUserId = order.UpdatedByUserId,
                UpdatedReason = order.UpdatedReason,
                Items = items
            };
        }

        public async Task<OrderDto> UpdateOrderStatusAsync(int orderId, int updatedByUserId, UpdateOrderStatusRequest request)
        {
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

            return new OrderDto
            {
                Id = order.Id,
                UserId = order.UserId,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                CreatedDate = order.CreatedDate,
                UpdatedByUserId = order.UpdatedByUserId,
                UpdatedReason = order.UpdatedReason,
                Items = items
            };
        }

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
