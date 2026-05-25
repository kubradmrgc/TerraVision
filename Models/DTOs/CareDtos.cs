using TerraVision.Api.Enums;

namespace TerraVision.Api.Models.DTOs
{
    public class CareTaskDto
    {
        public CareActionType ActionType { get; set; }
        public int? IntervalDays { get; set; }
        public DateTime? NextDueAt { get; set; }
        public DateTime? LastCompletedAt { get; set; }
        public CareTaskUrgency Urgency { get; set; }
        public bool IsActionEnabled { get; set; }
    }

    public class PlantCareCalendarDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductImageUrl { get; set; } = string.Empty;
        public string? CareInstructions { get; set; }
        public CareTaskUrgency OverallUrgency { get; set; }
        public IReadOnlyList<CareTaskDto> Tasks { get; set; } = Array.Empty<CareTaskDto>();
    }

    public class MyPlantCareCalendarResponse
    {
        public IReadOnlyList<PlantCareCalendarDto> Plants { get; set; } = Array.Empty<PlantCareCalendarDto>();
    }

    public class CompleteCareActionRequest
    {
        public CareActionType ActionType { get; set; }
        public string? Notes { get; set; }
    }
}
