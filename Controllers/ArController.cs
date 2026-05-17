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

            var normalizedPlatform = NormalizePlatform(platform);
            var requiredModelFormat = GetRequiredModelFormat(normalizedPlatform);
            var modelFormat = requiredModelFormat;
            string modelUrl;

            if (!string.IsNullOrWhiteSpace(product.ArModelFileName))
            {
                modelUrl = $"/assets/ar-models/{product.ArModelFileName}";
                modelFormat = Path.GetExtension(product.ArModelFileName).TrimStart('.').ToLowerInvariant();
                if (modelFormat != requiredModelFormat)
                {
                    return Conflict(
                        $"Product AR model format '{modelFormat}' is not supported on {normalizedPlatform}. Upload a .{requiredModelFormat} model for this platform.");
                }
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

        private static string NormalizePlatform(string? platform)
        {
            return string.Equals(platform?.Trim(), "ios", StringComparison.OrdinalIgnoreCase)
                ? "ios"
                : "android";
        }

        private static string GetRequiredModelFormat(string platform)
        {
            return platform == "ios" ? "usdz" : "gltf";
        }
    }
}
