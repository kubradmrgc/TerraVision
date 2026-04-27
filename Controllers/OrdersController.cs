using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpPost("from-cart")]
        public async Task<IActionResult> PlaceFromCart([FromBody] PlaceOrderRequest request)
        {
            var userId = GetCurrentUserId();
            var order = await _orderService.PlaceOrderFromCartAsync(userId, request);
            return Ok(order);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetCurrentUserId();
            var orders = await _orderService.GetMyOrdersAsync(userId);
            return Ok(orders);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders([FromQuery] AdminOrderListQuery query)
        {
            var orders = await _orderService.GetAllOrdersAsync(query);
            return Ok(orders);
        }

        [HttpGet("me/{orderId:int}")]
        public async Task<IActionResult> GetMyOrderById(int orderId)
        {
            var userId = GetCurrentUserId();
            var order = await _orderService.GetMyOrderByIdAsync(userId, orderId);
            return Ok(order);
        }

        [HttpPatch("{orderId:int}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int orderId, [FromBody] UpdateOrderStatusRequest request)
        {
            var adminUserId = GetCurrentUserId();
            var order = await _orderService.UpdateOrderStatusAsync(orderId, adminUserId, request);
            return Ok(order);
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user identity.");
            }

            return userId;
        }
    }
}
