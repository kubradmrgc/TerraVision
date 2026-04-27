using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync();
        Task<CategoryDto?> GetCategoryByIdAsync(int id);
        Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request);
        Task<CategoryDto> UpdateCategoryAsync(UpdateCategoryRequest request);
        Task DeleteCategoryAsync(int id);
    }
}
