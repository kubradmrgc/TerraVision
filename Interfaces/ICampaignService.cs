using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface ICampaignService
    {
        Task<StorefrontDto> GetStorefrontAsync();
        Task<IReadOnlyList<StoreCampaignDto>> GetAllCampaignsAsync();
        Task<StoreCampaignDto> GetCampaignByIdAsync(int id);
        Task<StoreCampaignDto> CreateCampaignAsync(UpsertStoreCampaignRequest request);
        Task<StoreCampaignDto> UpdateCampaignAsync(int id, UpsertStoreCampaignRequest request);
        Task DeleteCampaignAsync(int id);
        Task<ProductDto> UpdateProductPromotionAsync(int productId, UpdateProductPromotionRequest request);
    }
}
