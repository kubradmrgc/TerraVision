using Mapster;
using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Entities;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly IRepository<Category> _categoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CategoryService(IRepository<Category> categoryRepository, IUnitOfWork unitOfWork)
        {
            _categoryRepository = categoryRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
        {
            var categories = await _categoryRepository.Find(c => !c.IsDeleted).ToListAsync();
            return categories.Adapt<IEnumerable<CategoryDto>>();
        }

        public async Task<CategoryDto?> GetCategoryByIdAsync(int id)
        {
            var category = await _categoryRepository.SingleOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (category == null) throw new KeyNotFoundException("Category not found");
            return category.Adapt<CategoryDto>();
        }

        public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request)
        {
            var category = request.Adapt<Category>();
            await _categoryRepository.AddAsync(category);
            await _unitOfWork.CommitAsync();

            return category.Adapt<CategoryDto>();
        }

        public async Task<CategoryDto> UpdateCategoryAsync(UpdateCategoryRequest request)
        {
            var category = await _categoryRepository.SingleOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted);
            if (category == null) throw new KeyNotFoundException("Category not found");

            request.Adapt(category); // Apply updates using Mapster
            category.UpdatedDate = DateTime.UtcNow;

            _categoryRepository.Update(category);
            await _unitOfWork.CommitAsync();

            return category.Adapt<CategoryDto>();
        }

        public async Task DeleteCategoryAsync(int id)
        {
            var category = await _categoryRepository.SingleOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (category == null) throw new KeyNotFoundException("Category not found");

            category.IsDeleted = true; // Soft delete
            // Or _categoryRepository.Remove(category) for hard delete
            category.UpdatedDate = DateTime.UtcNow;
            
            _categoryRepository.Update(category);
            await _unitOfWork.CommitAsync();
        }
    }
}
