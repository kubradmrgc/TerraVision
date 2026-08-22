using TerraVision.Api.Enums;

namespace TerraVision.Api.Models.DTOs
{
    public class ConsultantKpiDto
    {
        public int ConsultantId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int TotalAppointments { get; set; }
        public int CompletedAppointments { get; set; }
        public int CancelledAppointments { get; set; }
        public int ConvertedAppointments { get; set; }
        public double ConversionRatePercent { get; set; }
        public double? AverageSatisfactionScore { get; set; }
        public int SatisfactionResponseCount { get; set; }
        public int PendingOutcomeCount { get; set; }
    }

    public class AppointmentConversionSummaryDto
    {
        public int TotalAppointments { get; set; }
        public int PendingCount { get; set; }
        public int ApprovedCount { get; set; }
        public int CompletedCount { get; set; }
        public int CancelledCount { get; set; }
        public int RecordedConversions { get; set; }
        public int InferredConversions { get; set; }
        public int TotalConverted { get; set; }
        public double ConversionRatePercent { get; set; }
        public double? AverageSatisfactionScore { get; set; }
    }

    public class ConsultantPerformanceBoardDto
    {
        public DateTime GeneratedAtUtc { get; set; }
        public AppointmentConversionSummaryDto Conversion { get; set; } = new();
        public IReadOnlyList<ConsultantKpiDto> Consultants { get; set; } = Array.Empty<ConsultantKpiDto>();
    }

    public class RecordAppointmentOutcomeRequest
    {
        public int Id { get; set; }
        public AppointmentOutcome Outcome { get; set; }
        public int? LinkedOrderId { get; set; }
        public int? SatisfactionScore { get; set; }
        public string? OutcomeNotes { get; set; }
    }
}
