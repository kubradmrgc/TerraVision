using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface ICartService
    {
        Task<CartDto> GetMyCartAsync(int userId);
        Task<CartDto> AddItemAsync(int userId, AddCartItemRequest request);
        Task<CartDto> UpdateItemAsync(int userId, UpdateCartItemRequest request);
        Task<CartDto> RemoveItemAsync(int userId, int productId);
        Task<CartDto> ClearAsync(int userId);
    }
}
