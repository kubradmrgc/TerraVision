namespace TerraVision.Api.Entities
{
    public class StoreCampaignProduct
    {
        public int CampaignId { get; set; }
        public virtual StoreCampaign Campaign { get; set; } = null!;

        public int ProductId { get; set; }
        public virtual Product Product { get; set; } = null!;

        public int SortOrder { get; set; }
    }
}
