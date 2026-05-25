using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface IArSessionService
    {
        Task<ArSessionResponseDto> SaveSessionAsync(
            int userId,
            SaveArSessionRequestDto request,
            IFormFile? screenshot,
            string? screenshotUrl = null,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyList<ArSessionResponseDto>> GetMySessionsAsync(int userId);

        Task<IReadOnlyList<ArSessionResponseDto>> GetAllSessionsAsync();
    }
}
