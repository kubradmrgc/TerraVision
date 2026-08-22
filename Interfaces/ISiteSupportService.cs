using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface ISiteSupportService
    {
        Task<SiteSupportFooterDto> GetFooterAsync();
        Task<SiteFeedbackSubmissionDto> SubmitFeedbackAsync(SubmitSiteFeedbackRequest request, int? userId);
        Task<IReadOnlyList<SiteFeedbackSubmissionDto>> GetSubmissionsForAdminAsync(int take = 100);
        Task<SiteSupportAdminOverviewDto> GetAdminOverviewAsync(int take = 200);
        Task<SiteFeedbackSubmissionDto> UpdateSubmissionStatusAsync(int id, SiteFeedbackStatus status);
    }
}
