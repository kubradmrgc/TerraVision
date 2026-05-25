using TerraVision.Api.Entities.Common;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Entities
{
    public class CareLog : BaseEntity
    {
        public int PlantCareCalendarId { get; set; }
        public virtual PlantCareCalendar PlantCareCalendar { get; set; } = null!;

        public CareActionType ActionType { get; set; }
        public DateTime CompletedAt { get; set; }
        public string? Notes { get; set; }
    }
}
