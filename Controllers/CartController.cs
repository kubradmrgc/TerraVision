using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Extensions;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyCart()
        {
            var userId = GetCurrentUserId();
            var cart = await _cartService.GetMyCartAsync(userId);
            return Ok(cart);
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest request)
        {
            var userId = GetCurrentUserId();
            var cart = await _cartService.AddItemAsync(userId, request);
            return Ok(cart);
        }

        [HttpPut("items")]
        public async Task<IActionResult> UpdateItem([FromBody] UpdateCartItemRequest request)
        {
            var userId = GetCurrentUserId();
            var cart = await _cartService.UpdateItemAsync(userId, request);
            return Ok(cart);
        }

        [HttpDelete("items/{productId:int}")]
        public async Task<IActionResult> RemoveItem(int productId)
        {
            var userId = GetCurrentUserId();
            var cart = await _cartService.RemoveItemAsync(userId, productId);
            return Ok(cart);
        }

        [HttpDelete("me")]
        public async Task<IActionResult> ClearCart()
        {
            var userId = GetCurrentUserId();
            var cart = await _cartService.ClearAsync(userId);
            return Ok(cart);
        }

        private int GetCurrentUserId()
        {
            if (!User.TryGetUserId(out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user identity.");
            }

            return userId;
        }
    }
}
