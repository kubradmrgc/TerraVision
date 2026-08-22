using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TerraVision.Api.Extensions;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet]
        [AllowAnonymous] // Anyone can view products
        [EnableRateLimiting(RateLimitPolicies.CatalogRead)]
        public async Task<IActionResult> GetAll()
        {
            var products = await _productService.GetAllProductsAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.CatalogRead)]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _productService.GetProductByIdAsync(id);
            return Ok(product);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
        {
            var product = await _productService.CreateProductAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        [HttpPost("with-image")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<IActionResult> CreateWithImage(
            [FromForm] CreateProductWithImageForm request,
            [FromForm] IFormFile image,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (image == null || image.Length <= 0)
            {
                return BadRequest(new { message = "Ürün görseli zorunludur." });
            }

            var product = await _productService.CreateProductWithImageAsync(
                new CreateProductWithImageRequest
                {
                    Name = request.Name.Trim(),
                    Description = request.Description.Trim(),
                    Price = request.Price,
                    StockQuantity = request.StockQuantity,
                    MinStockLevel = request.MinStockLevel,
                    SKU = request.SKU.Trim(),
                    IsArCompatible = request.IsArCompatible,
                    CategoryId = request.CategoryId,
                    WateringIntervalDays = request.WateringIntervalDays,
                    FertilizingIntervalDays = request.FertilizingIntervalDays,
                    CleaningIntervalDays = request.CleaningIntervalDays,
                    CareInstructions = string.IsNullOrWhiteSpace(request.CareInstructions)
                        ? null
                        : request.CareInstructions.Trim()
                },
                image,
                cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request)
        {
            if (id != request.Id) return BadRequest("ID mismatch");

            var product = await _productService.UpdateProductAsync(request);
            return Ok(product);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            await _productService.DeleteProductAsync(id);
            return NoContent();
        }
    }
}
