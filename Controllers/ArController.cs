using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ArController : ControllerBase
    {
        private readonly IProductService _productService;

        public ArController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet("products/{productId:int}/preview")]
        public async Task<IActionResult> GetProductPreview(int productId, [FromQuery] string platform = "android")
        {
            var product = await _productService.GetProductByIdAsync(productId);
            if (product == null || !product.IsArCompatible)
            {
                return NotFound("AR-compatible product not found.");
            }

            var normalizedPlatform = platform.Trim().ToLowerInvariant();
            var modelFormat = normalizedPlatform == "ios" ? "usdz" : "gltf";
            string modelUrl;

            if (!string.IsNullOrWhiteSpace(product.ArModelFileName))
            {
                modelUrl = $"/assets/ar-models/{product.ArModelFileName}";
                modelFormat = Path.GetExtension(product.ArModelFileName).TrimStart('.').ToLowerInvariant();
            }
            else
            {
                modelUrl = $"/assets/ar-models/{product.SKU}.{modelFormat}";
            }

            var response = new ArPreviewResponse
            {
                ProductId = product.Id,
                ProductName = product.Name,
                ModelUrl = modelUrl,
                ModelFormat = modelFormat,
                PlacementHint = "ground",
                SuggestedScale = 1.0m
            };

            return Ok(response);
        }
    }
}
