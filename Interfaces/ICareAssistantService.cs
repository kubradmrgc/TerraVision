using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces;

public interface ICareAssistantService
{
    Task<CareAssistantChatResponse> ChatAsync(int userId, CareAssistantChatRequest request, CancellationToken cancellationToken = default);
}
