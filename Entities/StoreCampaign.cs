using TerraVision.Api.Entities.Common;

namespace TerraVision.Api.Entities
{
    public class StoreCampaign : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? BadgeText { get; set; }
        public int SortOrder { get; set; }
        public DateTime? StartsAtUtc { get; set; }
        public DateTime? EndsAtUtc { get; set; }

        public virtual ICollection<StoreCampaignProduct> CampaignProducts { get; set; } = new HashSet<StoreCampaignProduct>();
    }
}
