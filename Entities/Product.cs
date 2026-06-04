using TerraVision.Api.Entities.Common;

namespace TerraVision.Api.Entities
{
    public class Product : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int MinStockLevel { get; set; }
        public string SKU { get; set; } = string.Empty; 
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsArCompatible { get; set; } 
        public string? ArModelFileName { get; set; }

        public int CategoryId { get; set; }
        public virtual Category Category { get; set; } = null!;

        public int? WateringIntervalDays { get; set; }
        public int? FertilizingIntervalDays { get; set; }
        public int? CleaningIntervalDays { get; set; }
        public string? CareInstructions { get; set; }

        /// <summary>Liste fiyatı; Price'dan yüksekse indirimli gösterilir.</summary>
        public decimal? CompareAtPrice { get; set; }
        public bool IsFeatured { get; set; }
        public string? PromoLabel { get; set; }
        public int PromoSortOrder { get; set; }
        public DateTime? PromoStartsAtUtc { get; set; }
        public DateTime? PromoEndsAtUtc { get; set; }

        public virtual ICollection<StoreCampaignProduct> CampaignProducts { get; set; } = new HashSet<StoreCampaignProduct>();
        public virtual ICollection<ArSession> ArSessions { get; set; } = new HashSet<ArSession>();
        public virtual ICollection<PlantCareCalendar> PlantCareCalendars { get; set; } = new HashSet<PlantCareCalendar>();
    }
}