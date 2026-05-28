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

            var cart = await GetOrCreateCartAsync(userId);
            var existingItem = await _dbContext.CartItems
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
                if (existingItem.IsDeleted)
                {
                    existingItem.Quantity = request.Quantity;
                    existingItem.IsDeleted = false;
                    existingItem.IsActive = true;
                }
                else
                {
                    existingItem.Quantity += request.Quantity;
                }

                existingItem.UpdatedDate = DateTime.UtcNow;
            }

            await _unitOfWork.CommitAsync();
            await PublishCartChangedAsync(userId, request.ProductId, request.Quantity, "added");
            return await BuildCartDtoAsync(cart.Id, userId);
        }

        public async Task<CartDto> UpdateItemAsync(int userId, UpdateCartItemRequest request)
        {
            var cart = await GetOrCreateCartAsync(userId);
            var item = await _dbContext.CartItems
                .SingleOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductId == request.ProductId && !ci.IsDeleted);

            if (item == null)
            {
                throw new KeyNotFoundException("Cart item not found.");
            }

            if (request.Quantity <= 0)
            {
                item.IsDeleted = true;
                item.UpdatedDate = DateTime.UtcNow;
            }
            else
            {
                item.Quantity = request.Quantity;
                item.UpdatedDate = DateTime.UtcNow;
            }

            await _unitOfWork.CommitAsync();
            await PublishCartChangedAsync(userId, request.ProductId, Math.Max(request.Quantity, 0), "updated");
            return await BuildCartDtoAsync(cart.Id, userId);
        }

        public async Task<CartDto> RemoveItemAsync(int userId, int productId)
        {
            var cart = await GetOrCreateCartAsync(userId);
            var item = await _dbContext.CartItems
                .SingleOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductId == productId && !ci.IsDeleted);

            if (item == null)
            {
                return await BuildCartDtoAsync(cart.Id, userId);
            }

            item.IsDeleted = true;
            item.UpdatedDate = DateTime.UtcNow;
            await _unitOfWork.CommitAsync();
            await PublishCartChangedAsync(userId, productId, 0, "removed");
            return await BuildCartDtoAsync(cart.Id, userId);
        }

        public async Task<CartDto> ClearAsync(int userId)
        {
            var cart = await GetOrCreateCartAsync(userId);
            var items = await _dbContext.CartItems
                .Where(ci => ci.CartId == cart.Id && !ci.IsDeleted)
                .ToListAsync();

            foreach (var item in items)
            {
                item.IsDeleted = true;
                item.UpdatedDate = DateTime.UtcNow;
            }

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
