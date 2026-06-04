using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TerraVision.Api.Extensions;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Services;

namespace TerraVision.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController : ControllerBase
{
    private readonly IMediaService _mediaService;
    private readonly IMediaPresignService _mediaPresignService;
    private readonly IProductService _productService;

    public MediaController(
        IMediaService mediaService,
        IMediaPresignService mediaPresignService,
        IProductService productService)
    {
        _mediaService = mediaService;
        _mediaPresignService = mediaPresignService;
        _productService = productService;
    }

    [HttpGet("upload-capabilities")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.CatalogRead)]
    public IActionResult GetUploadCapabilities() => Ok(_mediaPresignService.GetCapabilities());

    [HttpPost("ar-models/presign")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PresignArModel([FromBody] PresignUploadRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _mediaPresignService.PresignArModelAsync(request, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("ar-models/confirm")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ConfirmArModel(
        [FromBody] ConfirmPresignedUploadDto request,
        [FromQuery] int? productId,
        CancellationToken cancellationToken,
        [FromQuery] bool overwrite = false)
    {
        try
        {
            var result = await _mediaPresignService.ConfirmArModelAsync(request, cancellationToken);
            if (productId is null)
            {
                return Ok(new { Uploaded = result, Product = (object?)null });
            }

            var updatedProduct = await _productService.SetArModelFileNameAsync(productId.Value, result.FileName, overwrite);
            return Ok(new { Uploaded = result, Product = updatedProduct });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex) when (ex.Message == ArModelUrlRules.InvalidUrlMessage)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("ar-screenshots/presign")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> PresignArScreenshot([FromBody] PresignUploadRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _mediaPresignService.PresignArScreenshotAsync(request, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("product-images/presign")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PresignProductImage([FromBody] PresignUploadRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _mediaPresignService.PresignProductImageAsync(request, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("ar-models")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(MediaUploadRules.MaxArModelSizeBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MediaUploadRules.MaxArModelSizeBytes)]
    public async Task<IActionResult> UploadArModel(
        [FromForm] IFormFile file,
        [FromQuery] int? productId,
        CancellationToken cancellationToken,
        [FromQuery] bool overwrite = false)
    {
        try
        {
            var result = await _mediaService.UploadArModelAsync(file, cancellationToken);
            if (productId is null)
            {
                return Ok(new { Uploaded = result, Product = (object?)null });
            }

            var updatedProduct = await _productService.SetArModelFileNameAsync(productId.Value, result.FileName, overwrite);
            return Ok(new { Uploaded = result, Product = updatedProduct });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex) when (ex.Message == ArModelUrlRules.InvalidUrlMessage)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
        }
    }

    [HttpPost("product-images/confirm")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ConfirmProductImage(
        [FromBody] ConfirmPresignedUploadDto request,
        [FromQuery] int? productId,
        CancellationToken cancellationToken,
        [FromQuery] bool overwrite = false)
    {
        try
        {
            var result = await _mediaPresignService.ConfirmProductImageAsync(request, cancellationToken);
            if (productId is null)
            {
                return Ok(new { Uploaded = result, Product = (object?)null });
            }

            var updatedProduct = await _productService.SetImageUrlAsync(productId.Value, result.Url, overwrite);
            return Ok(new { Uploaded = result, Product = updatedProduct });
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

    [HttpPost("exchange-images")]
    [Authorize]
    [RequestSizeLimit(MediaUploadRules.MaxProductImageSizeBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MediaUploadRules.MaxProductImageSizeBytes)]
    public async Task<IActionResult> UploadExchangeImage([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediaService.UploadExchangeImageAsync(file, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("product-images")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(MediaUploadRules.MaxProductImageSizeBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MediaUploadRules.MaxProductImageSizeBytes)]
    public async Task<IActionResult> UploadProductImage(
        [FromForm] IFormFile file,
        [FromQuery] int? productId,
        CancellationToken cancellationToken,
        [FromQuery] bool overwrite = false)
    {
        try
        {
            var result = await _mediaService.UploadProductImageAsync(file, cancellationToken);
            if (productId is null)
            {
                return Ok(new { Uploaded = result, Product = (object?)null });
            }

            var updatedProduct = await _productService.SetImageUrlAsync(productId.Value, result.Url, overwrite);
            return Ok(new { Uploaded = result, Product = updatedProduct });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
