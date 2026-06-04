using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface ICareService
    {
        Task ProvisionCalendarsForDeliveredOrderAsync(int orderId);
        Task<MyPlantCareCalendarResponse> GetMyCalendarAsync(int userId);
        Task<PlantCareCalendarDto> AddPlantToGardenAsync(int userId, int productId);
        Task<IReadOnlyList<CareCatalogPlantDto>> GetCatalogPlantsAsync(int userId);
        Task<PlantCareCalendarDto> CompleteActionAsync(int userId, int calendarId, CompleteCareActionRequest request);
    }
}
