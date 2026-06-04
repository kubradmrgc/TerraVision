using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Services;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ArController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly IArSessionService _arSessionService;
        private readonly IMediaBlobStorage _mediaBlobStorage;
        private readonly MediaStorageSettings _mediaSettings;

        public ArController(
            IProductService productService,
            IArSessionService arSessionService,
            IMediaBlobStorage mediaBlobStorage,
            Microsoft.Extensions.Options.IOptions<MediaStorageSettings> mediaSettings)
        {
            _productService = productService;
            _arSessionService = arSessionService;
            _mediaBlobStorage = mediaBlobStorage;
            _mediaSettings = mediaSettings.Value;
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
                modelUrl = _mediaBlobStorage.ResolveClientUrl(
                    product.ArModelFileName,
                    _mediaSettings.Prefixes.ArModels);
                modelFormat = Path.GetExtension(product.ArModelFileName).TrimStart('.').ToLowerInvariant();
            }
            else
            {
                modelUrl = _mediaBlobStorage.ResolveClientUrl(
                    null,
                    _mediaSettings.Prefixes.ArModels,
                    $"{product.SKU}.{modelFormat}");
            }

            if (!ArModelUrlRules.IsValidPublicHttpsUrl(modelUrl))
            {
                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    ArModelUrlRules.InvalidUrlMessage);
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

        [HttpPost("sessions")]
        [Authorize(Roles = "Customer")]
        [RequestSizeLimit(15 * 1024 * 1024)]
        public async Task<IActionResult> SaveSession(
            [FromForm] int productId,
            [FromForm] string deviceModel,
            [FromForm] decimal scaleX,
            [FromForm] decimal scaleY,
            [FromForm] decimal scaleZ,
            [FromForm] decimal rotationY,
            [FromForm] string? environmentNotes,
            [FromForm] IFormFile? screenshot,
            [FromForm] string? screenshotUrl,
            CancellationToken cancellationToken)
        {
            if ((screenshot == null || screenshot.Length == 0) && string.IsNullOrWhiteSpace(screenshotUrl))
            {
                return BadRequest("Screenshot or screenshotUrl is required.");
            }

            var userId = GetCurrentUserId();
            var request = new SaveArSessionRequestDto
            {
                ProductId = productId,
                DeviceModel = deviceModel,
                ScaleX = scaleX,
                ScaleY = scaleY,
                ScaleZ = scaleZ,
                RotationY = rotationY,
                EnvironmentNotes = environmentNotes
            };

            try
            {
                var session = await _arSessionService.SaveSessionAsync(userId, request, screenshot, screenshotUrl, cancellationToken);
                return CreatedAtAction(nameof(GetMySessions), new { id = session.Id }, session);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("sessions/me")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMySessions()
        {
            var userId = GetCurrentUserId();
            var sessions = await _arSessionService.GetMySessionsAsync(userId);
            return Ok(sessions);
        }

        [HttpGet("sessions")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllSessions()
        {
            var sessions = await _arSessionService.GetAllSessionsAsync();
            return Ok(sessions);
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
