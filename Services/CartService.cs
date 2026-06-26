using System.Data;
using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Models.Realtime;

namespace TerraVision.Api.Services
{
    public class CartService : ICartService
    {
        private readonly TerraVisionDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRealtimeSyncService _realtimeSyncService;

        public CartService(
            TerraVisionDbContext dbContext,
            IUnitOfWork unitOfWork,
            IRealtimeSyncService realtimeSyncService)
        {
            _dbContext = dbContext;
            _unitOfWork = unitOfWork;
            _realtimeSyncService = realtimeSyncService;
        }

        public async Task<CartDto> GetMyCartAsync(int userId)
        {
            var cart = await GetOrCreateCartAsync(userId);
            return await BuildCartDtoAsync(cart.Id, userId);
        }

        public async Task<CartDto> AddItemAsync(int userId, AddCartItemRequest request)
        {
            if (request.Quantity <= 0)
            {
                throw new ArgumentException("Quantity must be greater than zero.");
            }

            var product = await _dbContext.Products
                .SingleOrDefaultAsync(p => p.Id == request.ProductId && !p.IsDeleted && p.IsActive);
            if (product == null)
            {
                throw new KeyNotFoundException("Product not found.");
            }

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var cart = await GetOrCreateCartAsync(userId);
            var existingItem = await _dbContext.CartItems
                .AsNoTracking()
                .SingleOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductId == request.ProductId);

            if (existingItem == null)
            {
                await _dbContext.CartItems.AddAsync(new CartItem
                {
                    CartId = cart.Id,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity
                });
            }
            else
            {
                var nowUtc = DateTime.UtcNow;
                int updatedRows;
                if (existingItem.IsDeleted)
                {
                    updatedRows = await _dbContext.CartItems
                        .Where(ci =>
                            ci.Id == existingItem.Id &&
                            ci.CartId == cart.Id &&
                            ci.ProductId == request.ProductId &&
                            ci.IsDeleted)
                        .ExecuteUpdateAsync(updates => updates
                            .SetProperty(ci => ci.Quantity, request.Quantity)
                            .SetProperty(ci => ci.IsDeleted, false)
                            .SetProperty(ci => ci.UpdatedDate, nowUtc));
                }
                else
                {
                    if (existingItem.Quantity > int.MaxValue - request.Quantity)
                    {
                        throw new ArgumentException("Cart item quantity is too large.");
                    }

                    updatedRows = await _dbContext.CartItems
                        .Where(ci =>
                            ci.Id == existingItem.Id &&
                            ci.CartId == cart.Id &&
                            ci.ProductId == request.ProductId &&
                            ci.Quantity == existingItem.Quantity &&
                            !ci.IsDeleted)
                        .ExecuteUpdateAsync(updates => updates
                            .SetProperty(ci => ci.Quantity, ci => ci.Quantity + request.Quantity)
                            .SetProperty(ci => ci.UpdatedDate, nowUtc));
                }

                if (updatedRows != 1)
                {
                    throw new InvalidOperationException("Cart changed. Please review your cart and try again.");
                }
            }

            await _unitOfWork.CommitAsync();
            await transaction.CommitAsync();

            await PublishCartChangedAsync(userId, request.ProductId, request.Quantity, "added");
            return await BuildCartDtoAsync(cart.Id, userId);
        }

        public async Task<CartDto> UpdateItemAsync(int userId, UpdateCartItemRequest request)
        {
            var cart = await GetOrCreateCartAsync(userId);
            var item = await _dbContext.CartItems
                .AsNoTracking()
                .SingleOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductId == request.ProductId && !ci.IsDeleted);

            if (item == null)
            {
                throw new KeyNotFoundException("Cart item not found.");
            }

            var nowUtc = DateTime.UtcNow;
            int updatedRows;
            if (request.Quantity <= 0)
            {
                updatedRows = await _dbContext.CartItems
                    .Where(ci =>
                        ci.Id == item.Id &&
                        ci.CartId == cart.Id &&
                        ci.ProductId == request.ProductId &&
                        ci.Quantity == item.Quantity &&
                        !ci.IsDeleted)
                    .ExecuteUpdateAsync(updates => updates
                        .SetProperty(ci => ci.IsDeleted, true)
                        .SetProperty(ci => ci.UpdatedDate, nowUtc));
            }
            else
            {
                updatedRows = await _dbContext.CartItems
                    .Where(ci =>
                        ci.Id == item.Id &&
                        ci.CartId == cart.Id &&
                        ci.ProductId == request.ProductId &&
                        ci.Quantity == item.Quantity &&
                        !ci.IsDeleted)
                    .ExecuteUpdateAsync(updates => updates
                        .SetProperty(ci => ci.Quantity, request.Quantity)
                        .SetProperty(ci => ci.UpdatedDate, nowUtc));
            }

            if (updatedRows != 1)
            {
                throw new InvalidOperationException("Cart changed. Please review your cart and try again.");
            }

            await _unitOfWork.CommitAsync();
            await PublishCartChangedAsync(userId, request.ProductId, Math.Max(request.Quantity, 0), "updated");
            return await BuildCartDtoAsync(cart.Id, userId);
        }

        public async Task<CartDto> RemoveItemAsync(int userId, int productId)
        {
            var cart = await GetOrCreateCartAsync(userId);
            var item = await _dbContext.CartItems
                .AsNoTracking()
                .SingleOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductId == productId && !ci.IsDeleted);

            if (item == null)
            {
                return await BuildCartDtoAsync(cart.Id, userId);
            }

            var nowUtc = DateTime.UtcNow;
            var updatedRows = await _dbContext.CartItems
                .Where(ci =>
                    ci.Id == item.Id &&
                    ci.CartId == cart.Id &&
                    ci.ProductId == productId &&
                    ci.Quantity == item.Quantity &&
                    !ci.IsDeleted)
                .ExecuteUpdateAsync(updates => updates
                    .SetProperty(ci => ci.IsDeleted, true)
                    .SetProperty(ci => ci.UpdatedDate, nowUtc));

            if (updatedRows != 1)
            {
                throw new InvalidOperationException("Cart changed. Please review your cart and try again.");
            }

            await _unitOfWork.CommitAsync();
            await PublishCartChangedAsync(userId, productId, 0, "removed");
            return await BuildCartDtoAsync(cart.Id, userId);
        }

        public async Task<CartDto> ClearAsync(int userId)
        {
            var cart = await GetOrCreateCartAsync(userId);
            var nowUtc = DateTime.UtcNow;
            await _dbContext.CartItems
                .Where(ci => ci.CartId == cart.Id && !ci.IsDeleted)
                .ExecuteUpdateAsync(updates => updates
                    .SetProperty(ci => ci.IsDeleted, true)
                    .SetProperty(ci => ci.UpdatedDate, nowUtc));

            await _unitOfWork.CommitAsync();
            await PublishCartChangedAsync(userId, 0, 0, "cleared");
            return await BuildCartDtoAsync(cart.Id, userId);
        }

        private async Task<Cart> GetOrCreateCartAsync(int userId)
        {
            var cart = await _dbContext.Carts.SingleOrDefaultAsync(c => c.UserId == userId && !c.IsDeleted);
            if (cart != null)
            {
                return cart;
            }

            cart = new Cart { UserId = userId };
            await _dbContext.Carts.AddAsync(cart);
            await _unitOfWork.CommitAsync();
            return cart;
        }

        private async Task<CartDto> BuildCartDtoAsync(int cartId, int userId)
        {
            var items = await _dbContext.CartItems
                .AsNoTracking()
                .Where(ci => ci.CartId == cartId && !ci.IsDeleted)
                .Join(_dbContext.Products,
                    ci => ci.ProductId,
                    p => p.Id,
                    (ci, p) => new CartItemDto
                    {
                        ProductId = p.Id,
                        ProductName = p.Name,
                        UnitPrice = p.Price,
                        Quantity = ci.Quantity
                    })
                .ToListAsync();

            return new CartDto
            {
                CartId = cartId,
                UserId = userId,
                Items = items,
                TotalAmount = items.Sum(x => x.LineTotal)
            };
        }

        private Task PublishCartChangedAsync(int userId, int productId, int quantity, string action)
        {
            return _realtimeSyncService.BroadcastCartChangedAsync(new CartChangedEvent
            {
                UserId = userId,
                ProductId = productId,
                Quantity = quantity,
                Action = action,
                OccurredAtUtc = DateTime.UtcNow
            });
        }
    }
}
