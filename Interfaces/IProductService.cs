using Microsoft.AspNetCore.Http;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface IProductService
    {
        Task<IEnumerable<ProductDto>> GetAllProductsAsync();
        Task<ProductDto?> GetProductByIdAsync(int id);
        Task<ProductDto> CreateProductAsync(CreateProductRequest request);
        Task<ProductDto> CreateProductWithImageAsync(CreateProductWithImageRequest request, IFormFile image, CancellationToken cancellationToken = default);
        Task<ProductDto> SetImageUrlAsync(int productId, string imageUrl, bool overwriteExisting = false);
        Task<ProductDto> UpdateProductAsync(UpdateProductRequest request);
        Task DeleteProductAsync(int id);
        Task<ProductDto> SetArModelFileNameAsync(int productId, string arModelFileName, bool overwriteExisting = false);
        Task InvalidateProductCacheAsync();
    }
}
