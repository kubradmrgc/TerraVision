using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Interfaces;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class MediaController : ControllerBase
    {
        private readonly IMediaService _mediaService;
        private readonly IProductService _productService;

        public MediaController(IMediaService mediaService, IProductService productService)
        {
            _mediaService = mediaService;
            _productService = productService;
        }

        [HttpPost("ar-models")]
        [RequestSizeLimit(50 * 1024 * 1024)]
        public async Task<IActionResult> UploadArModel(
            [FromForm] IFormFile file,
            [FromQuery] int? productId,
            CancellationToken cancellationToken,
            [FromQuery] bool overwrite = false)
        {
            var result = await _mediaService.UploadArModelAsync(file, cancellationToken);
            if (productId is null)
            {
                return Ok(new
                {
                    Uploaded = result,
                    Product = (object?)null
                });
            }

            var updatedProduct = await _productService.SetArModelFileNameAsync(productId.Value, result.FileName, overwrite);
            return Ok(new
            {
                Uploaded = result,
                Product = updatedProduct
            });
        }
    }
}
