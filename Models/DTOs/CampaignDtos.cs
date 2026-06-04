namespace TerraVision.Api.Models.DTOs
{
    public class StoreCampaignDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? BadgeText { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public DateTime? StartsAtUtc { get; set; }
        public DateTime? EndsAtUtc { get; set; }
        public IReadOnlyList<int> ProductIds { get; set; } = Array.Empty<int>();
    }

    public class StorefrontDto
    {
        public IReadOnlyList<StoreCampaignDto> Campaigns { get; set; } = Array.Empty<StoreCampaignDto>();
        public IReadOnlyList<ProductDto> DealProducts { get; set; } = Array.Empty<ProductDto>();
        public IReadOnlyList<ProductDto> FeaturedProducts { get; set; } = Array.Empty<ProductDto>();
    }

    public class UpsertStoreCampaignRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? BadgeText { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? StartsAtUtc { get; set; }
        public DateTime? EndsAtUtc { get; set; }
        public IReadOnlyList<int> ProductIds { get; set; } = Array.Empty<int>();
    }

    public class UpdateProductPromotionRequest
    {
        public decimal? CompareAtPrice { get; set; }
        public bool IsFeatured { get; set; }
        public string? PromoLabel { get; set; }
        public int PromoSortOrder { get; set; }
        public DateTime? PromoStartsAtUtc { get; set; }
        public DateTime? PromoEndsAtUtc { get; set; }
    }
}
