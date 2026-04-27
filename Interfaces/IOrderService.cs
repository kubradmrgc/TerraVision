using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface IOrderService
    {
        Task<OrderDto> PlaceOrderFromCartAsync(int userId, PlaceOrderRequest request);
        Task<IEnumerable<OrderDto>> GetMyOrdersAsync(int userId);
        Task<PagedResult<OrderDto>> GetAllOrdersAsync(AdminOrderListQuery query);
        Task<OrderDto> GetMyOrderByIdAsync(int userId, int orderId);
        Task<OrderDto> UpdateOrderStatusAsync(int orderId, int updatedByUserId, UpdateOrderStatusRequest request);
    }
}
