using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface IProductService
    {
        Task<IEnumerable<ProductDto>> GetAllProductsAsync();
        Task<ProductDto?> GetProductByIdAsync(int id);
        Task<ProductDto> CreateProductAsync(CreateProductRequest request);
        Task<ProductDto> UpdateProductAsync(UpdateProductRequest request);
        Task DeleteProductAsync(int id);
        Task<ProductDto> SetArModelFileNameAsync(int productId, string arModelFileName, bool overwriteExisting = false);
    }
}
