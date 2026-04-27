using Mapster;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TerraVision.Api.Entities;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services
{
    public class ProductService : IProductService
    {
        private readonly IRepository<Product> _productRepository;
        private readonly ICategoryService _categoryService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IDistributedCache _distributedCache;
        private const string ProductListCacheKey = "products:all:v1";

        public ProductService(
            IRepository<Product> productRepository,
            ICategoryService categoryService,
            IUnitOfWork unitOfWork,
            IDistributedCache distributedCache)
        {
            _productRepository = productRepository;
            _categoryService = categoryService;
            _unitOfWork = unitOfWork;
            _distributedCache = distributedCache;
        }

        public async Task<IEnumerable<ProductDto>> GetAllProductsAsync()
        {
            var cached = await _distributedCache.GetStringAsync(ProductListCacheKey);
            if (!string.IsNullOrWhiteSpace(cached))
            {
                var cachedItems = JsonSerializer.Deserialize<List<ProductDto>>(cached);
                if (cachedItems is not null)
                {
                    return cachedItems;
                }
            }

            var products = await _productRepository.Find(p => !p.IsDeleted).ToListAsync();
            var productDtos = products.Adapt<List<ProductDto>>();

            await _distributedCache.SetStringAsync(
                ProductListCacheKey,
                JsonSerializer.Serialize(productDtos),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
                });

            return productDtos;
        }

        public async Task<ProductDto?> GetProductByIdAsync(int id)
        {
            var product = await _productRepository.SingleOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
            if (product == null) throw new KeyNotFoundException("Product not found");
            return product.Adapt<ProductDto>();
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductRequest request)
        {
            // Verify Category Exists
            _ = await _categoryService.GetCategoryByIdAsync(request.CategoryId);

            var product = request.Adapt<Product>();
            await _productRepository.AddAsync(product);
            await _unitOfWork.CommitAsync();
            await InvalidateProductCacheAsync();

            return product.Adapt<ProductDto>();
        }

        public async Task<ProductDto> UpdateProductAsync(UpdateProductRequest request)
        {
            var product = await _productRepository.SingleOrDefaultAsync(p => p.Id == request.Id && !p.IsDeleted);
            if (product == null) throw new KeyNotFoundException("Product not found");

            // Verify Category
            if (product.CategoryId != request.CategoryId)
            {
                _ = await _categoryService.GetCategoryByIdAsync(request.CategoryId);
            }

            request.Adapt(product);
            product.UpdatedDate = DateTime.UtcNow;

            _productRepository.Update(product);
            await _unitOfWork.CommitAsync();
            await InvalidateProductCacheAsync();

            return product.Adapt<ProductDto>();
        }

        public async Task DeleteProductAsync(int id)
        {
            var product = await _productRepository.SingleOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
            if (product == null) throw new KeyNotFoundException("Product not found");

            product.IsDeleted = true;
            product.UpdatedDate = DateTime.UtcNow;
            
            _productRepository.Update(product);
            await _unitOfWork.CommitAsync();
            await InvalidateProductCacheAsync();
        }

        public async Task<ProductDto> SetArModelFileNameAsync(int productId, string arModelFileName, bool overwriteExisting = false)
        {
            if (string.IsNullOrWhiteSpace(arModelFileName))
            {
                throw new ArgumentException("AR model file name is required.");
            }

            var product = await _productRepository.SingleOrDefaultAsync(p => p.Id == productId && !p.IsDeleted);
            if (product == null)
            {
                throw new KeyNotFoundException("Product not found");
            }

            if (!overwriteExisting && !string.IsNullOrWhiteSpace(product.ArModelFileName))
            {
                throw new InvalidOperationException("Product already has an AR model. Use overwrite option to replace it.");
            }

            product.ArModelFileName = arModelFileName;
            product.IsArCompatible = true;
            product.UpdatedDate = DateTime.UtcNow;

            _productRepository.Update(product);
            await _unitOfWork.CommitAsync();
            await InvalidateProductCacheAsync();

            return product.Adapt<ProductDto>();
        }

        private Task InvalidateProductCacheAsync()
        {
            return _distributedCache.RemoveAsync(ProductListCacheKey);
        }
    }
}
