using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TerraVision.Api.Enums;
using TerraVision.Api.Extensions;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/exchange")]
    public class ExchangeController : ControllerBase
    {
        private readonly IExchangeService _exchangeService;

        public ExchangeController(IExchangeService exchangeService)
        {
            _exchangeService = exchangeService;
        }

        [HttpGet("products")]
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.CatalogRead)]
        public async Task<IActionResult> ListProducts(
            [FromQuery] ExchangeCondition? condition,
            [FromQuery] bool? swapOnly,
            CancellationToken cancellationToken)
        {
            var products = await _exchangeService.ListActiveProductsAsync(condition, swapOnly, cancellationToken);
            return Ok(products);
        }

        [HttpGet("products/{id:int}")]
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.CatalogRead)]
        public async Task<IActionResult> GetProduct(int id, CancellationToken cancellationToken)
        {
            var product = await _exchangeService.GetProductByIdAsync(id, cancellationToken);
            return Ok(product);
        }

        [HttpGet("products/mine")]
        [Authorize]
        public async Task<IActionResult> GetMyProducts(CancellationToken cancellationToken)
        {
            var ownerId = GetCurrentUserId();
            var products = await _exchangeService.GetMyProductsAsync(ownerId, cancellationToken);
            return Ok(products);
        }

        [HttpPost("products")]
        [Authorize]
        [EnableRateLimiting(RateLimitPolicies.AppointmentsWrite)]
        public async Task<IActionResult> CreateProduct([FromBody] CreateExchangeProductRequest request, CancellationToken cancellationToken)
        {
            var ownerId = GetCurrentUserId();
            var product = await _exchangeService.CreateProductAsync(ownerId, request, cancellationToken);
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        [HttpPut("products/{id:int}")]
        [Authorize]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateExchangeProductRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("ID mismatch");
            }

            var ownerId = GetCurrentUserId();
            var product = await _exchangeService.UpdateProductAsync(ownerId, request, cancellationToken);
            return Ok(product);
        }

        [HttpDelete("products/{id:int}")]
        [Authorize]
        public async Task<IActionResult> DeleteProduct(int id, CancellationToken cancellationToken)
        {
            var ownerId = GetCurrentUserId();
            await _exchangeService.DeleteProductAsync(ownerId, id, cancellationToken);
            return NoContent();
        }

        [HttpPost("offers")]
        [Authorize]
        [EnableRateLimiting(RateLimitPolicies.AppointmentsWrite)]
        public async Task<IActionResult> CreateOffer([FromBody] CreateExchangeOfferRequest request, CancellationToken cancellationToken)
        {
            var senderId = GetCurrentUserId();
            var offer = await _exchangeService.CreateOfferAsync(senderId, request, cancellationToken);
            return CreatedAtAction(nameof(GetReceivedOffers), offer);
        }

        [HttpGet("offers/received")]
        [Authorize]
        public async Task<IActionResult> GetReceivedOffers(CancellationToken cancellationToken)
        {
            var ownerId = GetCurrentUserId();
            var offers = await _exchangeService.GetReceivedOffersAsync(ownerId, cancellationToken);
            return Ok(offers);
        }

        [HttpGet("offers/sent")]
        [Authorize]
        public async Task<IActionResult> GetSentOffers(CancellationToken cancellationToken)
        {
            var senderId = GetCurrentUserId();
            var offers = await _exchangeService.GetSentOffersAsync(senderId, cancellationToken);
            return Ok(offers);
        }

        [HttpPut("offers/{id:int}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateOfferStatus(int id, [FromBody] UpdateExchangeOfferStatusRequest request, CancellationToken cancellationToken)
        {
            if (id != request.Id)
            {
                return BadRequest("ID mismatch");
            }

            var ownerId = GetCurrentUserId();
            var offer = await _exchangeService.UpdateOfferStatusAsync(ownerId, request, cancellationToken);
            return Ok(offer);
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
