using Mapster;
using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services
{
    public class CampaignService : ICampaignService
    {
        private readonly TerraVisionDbContext _db;
        private readonly IProductService _productService;

        public CampaignService(TerraVisionDbContext db, IProductService productService)
        {
            _db = db;
            _productService = productService;
        }

        public async Task<StorefrontDto> GetStorefrontAsync()
        {
            var now = DateTime.UtcNow;
            var products = (await _productService.GetAllProductsAsync()).ToList();

            var campaigns = await _db.StoreCampaigns
                .AsNoTracking()
                .Include(c => c.CampaignProducts)
                .Where(c =>
                    !c.IsDeleted
                    && c.IsActive
                    && (!c.StartsAtUtc.HasValue || now >= c.StartsAtUtc.Value)
                    && (!c.EndsAtUtc.HasValue || now <= c.EndsAtUtc.Value))
                .OrderBy(c => c.SortOrder)
                .ThenByDescending(c => c.CreatedDate)
                .ToListAsync();

            var campaignDtos = campaigns.Select(MapCampaign).ToList();
            var campaignProductIds = campaigns
                .SelectMany(c => c.CampaignProducts.Select(cp => cp.ProductId))
                .ToHashSet();

            var dealProducts = products
                .Where(p => IsDealProduct(p, now) || campaignProductIds.Contains(p.Id))
                .OrderByDescending(p => ProductDiscountPercent(p) ?? 0)
                .ThenBy(p => p.PromoSortOrder)
                .ToList();

            var featuredProducts = products
                .Where(p => p.IsFeatured && IsPromoScheduleActive(p.PromoStartsAtUtc, p.PromoEndsAtUtc, now))
                .OrderBy(p => p.PromoSortOrder)
                .ThenBy(p => p.Name)
                .ToList();

            return new StorefrontDto
            {
                Campaigns = campaignDtos,
                DealProducts = dealProducts,
                FeaturedProducts = featuredProducts
            };
        }

        public async Task<IReadOnlyList<StoreCampaignDto>> GetAllCampaignsAsync()
        {
            var rows = await _db.StoreCampaigns
                .AsNoTracking()
                .Include(c => c.CampaignProducts)
                .Where(c => !c.IsDeleted)
                .OrderBy(c => c.SortOrder)
                .ThenByDescending(c => c.CreatedDate)
                .ToListAsync();
            return rows.Select(MapCampaign).ToList();
        }

        public async Task<StoreCampaignDto> GetCampaignByIdAsync(int id)
        {
            var row = await LoadCampaignOrThrow(id);
            return MapCampaign(row);
        }

        public async Task<StoreCampaignDto> CreateCampaignAsync(UpsertStoreCampaignRequest request)
        {
            ValidateCampaignRequest(request);
            var entity = new StoreCampaign
            {
                Title = request.Title.Trim(),
                Subtitle = request.Subtitle?.Trim(),
                BadgeText = request.BadgeText?.Trim(),
                SortOrder = request.SortOrder,
                IsActive = request.IsActive,
                StartsAtUtc = request.StartsAtUtc,
                EndsAtUtc = request.EndsAtUtc
            };
            _db.StoreCampaigns.Add(entity);
            await _db.SaveChangesAsync();
            await ReplaceCampaignProductsAsync(entity.Id, request.ProductIds);
            return MapCampaign(await LoadCampaignOrThrow(entity.Id));
        }

        public async Task<StoreCampaignDto> UpdateCampaignAsync(int id, UpsertStoreCampaignRequest request)
        {
            ValidateCampaignRequest(request);
            var entity = await _db.StoreCampaigns.SingleAsync(c => c.Id == id && !c.IsDeleted);
            entity.Title = request.Title.Trim();
            entity.Subtitle = request.Subtitle?.Trim();
            entity.BadgeText = request.BadgeText?.Trim();
            entity.SortOrder = request.SortOrder;
            entity.IsActive = request.IsActive;
            entity.StartsAtUtc = request.StartsAtUtc;
            entity.EndsAtUtc = request.EndsAtUtc;
            await _db.SaveChangesAsync();
            await ReplaceCampaignProductsAsync(id, request.ProductIds);
            return MapCampaign(await LoadCampaignOrThrow(id));
        }

        public async Task DeleteCampaignAsync(int id)
        {
            var entity = await _db.StoreCampaigns.SingleAsync(c => c.Id == id && !c.IsDeleted);
            entity.IsDeleted = true;
            await _db.SaveChangesAsync();
        }

        public async Task<ProductDto> UpdateProductPromotionAsync(int productId, UpdateProductPromotionRequest request)
        {
            if (request.CompareAtPrice.HasValue && request.CompareAtPrice.Value < 0)
            {
                throw new ArgumentException("Compare-at price cannot be negative.");
            }

            var product = await _db.Products.SingleAsync(p => p.Id == productId && !p.IsDeleted);
            product.CompareAtPrice = request.CompareAtPrice;
            product.IsFeatured = request.IsFeatured;
            product.PromoLabel = string.IsNullOrWhiteSpace(request.PromoLabel) ? null : request.PromoLabel.Trim();
            product.PromoSortOrder = request.PromoSortOrder;
            product.PromoStartsAtUtc = request.PromoStartsAtUtc;
            product.PromoEndsAtUtc = request.PromoEndsAtUtc;
            await _db.SaveChangesAsync();
            await _productService.InvalidateProductCacheAsync();
            return (await _productService.GetProductByIdAsync(productId))!;
        }

        private async Task ReplaceCampaignProductsAsync(int campaignId, IReadOnlyList<int> productIds)
        {
            var existing = await _db.StoreCampaignProducts.Where(cp => cp.CampaignId == campaignId).ToListAsync();
            _db.StoreCampaignProducts.RemoveRange(existing);

            var order = 0;
            foreach (var productId in productIds.Distinct())
            {
                var exists = await _db.Products.AnyAsync(p => p.Id == productId && !p.IsDeleted);
                if (!exists)
                {
                    throw new KeyNotFoundException($"Product {productId} not found.");
                }

                _db.StoreCampaignProducts.Add(new StoreCampaignProduct
                {
                    CampaignId = campaignId,
                    ProductId = productId,
                    SortOrder = order++
                });
            }

            await _db.SaveChangesAsync();
        }

        private async Task<StoreCampaign> LoadCampaignOrThrow(int id)
        {
            var row = await _db.StoreCampaigns
                .AsNoTracking()
                .Include(c => c.CampaignProducts)
                .SingleOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (row == null)
            {
                throw new KeyNotFoundException("Campaign not found.");
            }

            return row;
        }

        private static StoreCampaignDto MapCampaign(StoreCampaign c)
        {
            return new StoreCampaignDto
            {
                Id = c.Id,
                Title = c.Title,
                Subtitle = c.Subtitle,
                BadgeText = c.BadgeText,
                SortOrder = c.SortOrder,
                IsActive = c.IsActive,
                StartsAtUtc = c.StartsAtUtc,
                EndsAtUtc = c.EndsAtUtc,
                ProductIds = c.CampaignProducts
                    .OrderBy(cp => cp.SortOrder)
                    .Select(cp => cp.ProductId)
                    .ToList()
            };
        }

        private static void ValidateCampaignRequest(UpsertStoreCampaignRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                throw new ArgumentException("Campaign title is required.");
            }
        }

        private static bool IsPromoScheduleActive(DateTime? starts, DateTime? ends, DateTime now)
        {
            if (starts.HasValue && now < starts.Value)
            {
                return false;
            }

            if (ends.HasValue && now > ends.Value)
            {
                return false;
            }

            return true;
        }

        private static bool IsDealProduct(ProductDto p, DateTime now)
        {
            if (!IsPromoScheduleActive(p.PromoStartsAtUtc, p.PromoEndsAtUtc, now))
            {
                return false;
            }

            if (p.CompareAtPrice.HasValue && p.CompareAtPrice.Value > p.Price)
            {
                return true;
            }

            return !string.IsNullOrWhiteSpace(p.PromoLabel);
        }

        private static int? ProductDiscountPercent(ProductDto p)
        {
            if (!p.CompareAtPrice.HasValue || p.CompareAtPrice.Value <= p.Price || p.CompareAtPrice.Value <= 0)
            {
                return null;
            }

            return (int)Math.Round((1 - p.Price / p.CompareAtPrice.Value) * 100);
        }
    }
}
