using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface IChatService
    {
        Task<ConsultationSessionDto> CreateSessionAsync(int customerId, CreateConsultationSessionRequest request);
        Task<IReadOnlyList<ConsultationSessionDto>> GetMySessionsAsync(int userId, UserRole role);
        Task<ConsultationSessionDto> GetSessionAsync(int sessionId, int userId, UserRole role);
        Task<IReadOnlyList<ChatMessageDto>> GetMessagesAsync(int sessionId, int userId, UserRole role);
        Task<ChatMessageDto> SendMessageAsync(int sessionId, int senderId, string content);
        Task<ChatMessageDto> SendProposalAsync(int sessionId, int consultantId, SendProposalRequest request);
        Task EnsureParticipantAsync(int sessionId, int userId);
        Task<IReadOnlyList<ChatConsultantDto>> GetConsultantsAsync();
    }
}
