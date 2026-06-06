using System.ComponentModel.DataAnnotations;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Models.DTOs
{
    public class SiteContactChannelDto
    {
        public string ChannelKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class SiteSupportFooterDto
    {
        public IReadOnlyList<SiteContactChannelDto> Channels { get; set; } = Array.Empty<SiteContactChannelDto>();
        public string UserStoryHint { get; set; } = string.Empty;
    }

    public class SubmitSiteFeedbackRequest
    {
        [Required]
        [EmailAddress]
        [MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(20)]
        [MaxLength(2000)]
        public string UserStory { get; set; } = string.Empty;

        public SiteFeedbackKind Kind { get; set; } = SiteFeedbackKind.WebsiteIssue;

        [MaxLength(500)]
        public string? PageUrl { get; set; }
    }

    public class SiteContactChannelAdminDto
    {
        public int Id { get; set; }
        public string ChannelKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
    }

    public class SiteSupportAdminOverviewDto
    {
        public IReadOnlyList<SiteContactChannelAdminDto> Channels { get; set; } = Array.Empty<SiteContactChannelAdminDto>();
        public IReadOnlyList<SiteFeedbackSubmissionDto> Submissions { get; set; } = Array.Empty<SiteFeedbackSubmissionDto>();
        public int NewSubmissionCount { get; set; }
        public int TotalSubmissionCount { get; set; }
    }

    public class SiteFeedbackSubmissionDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string UserStory { get; set; } = string.Empty;
        public SiteFeedbackKind Kind { get; set; }
        public SiteFeedbackStatus Status { get; set; }
        public string? PageUrl { get; set; }
        public int? UserId { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class UpdateSiteFeedbackStatusRequest
    {
        public SiteFeedbackStatus Status { get; set; }
    }
}
