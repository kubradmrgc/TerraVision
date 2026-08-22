using TerraVision.Api.Entities.Common;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Entities
{
    /// <summary>User-submitted site issue / support message (user story format).</summary>
    public class SiteFeedbackSubmission : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string UserStory { get; set; } = string.Empty;
        public SiteFeedbackKind Kind { get; set; }
        public SiteFeedbackStatus Status { get; set; } = SiteFeedbackStatus.New;
        public string? PageUrl { get; set; }
        public int? UserId { get; set; }
        public virtual User? User { get; set; }
    }
}
