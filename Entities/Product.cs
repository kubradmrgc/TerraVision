using TerraVision.Api.Entities.Common;

namespace TerraVision.Api.Entities
{
    public class Product : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public string SKU { get; set; } = string.Empty; 
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsArCompatible { get; set; } 
        public string? ArModelFileName { get; set; }

        public int CategoryId { get; set; }
        public virtual Category Category { get; set; } = null!;
    }
}