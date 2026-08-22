using TerraVision.Api.Entities.Common;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Entities
{
    public class ExchangeProduct : BaseEntity
    {
        public int OwnerId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public ExchangeCondition Condition { get; set; } = ExchangeCondition.Healthy;
        /// <summary>JSON array of public image URLs.</summary>
        public string PhotoUrlsJson { get; set; } = "[]";
        public ExchangeProductStatus Status { get; set; } = ExchangeProductStatus.Available;

        public virtual User Owner { get; set; } = null!;
        public virtual ICollection<ExchangeOffer> Offers { get; set; } = new HashSet<ExchangeOffer>();
    }
}
