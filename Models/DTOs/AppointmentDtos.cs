using TerraVision.Api.Enums;

namespace TerraVision.Api.Models.DTOs
{
    public class AppointmentDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int ConsultantId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string Notes { get; set; } = string.Empty;
        public AppointmentStatus Status { get; set; }
        public AppointmentOutcome Outcome { get; set; }
        public int? LinkedOrderId { get; set; }
        public int? SatisfactionScore { get; set; }
        public string? OutcomeNotes { get; set; }
        public DateTime? OutcomeRecordedAt { get; set; }
        public byte[] RowVersion { get; set; } = Array.Empty<byte>();
    }

    public class CreateAppointmentRequest
    {
        public int ConsultantId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    public class UpdateAppointmentStatusRequest
    {
        public int Id { get; set; }
        public AppointmentStatus Status { get; set; }
        /// <summary>Optional optimistic token from a recent GET; omit to use server-loaded version.</summary>
        public byte[]? RowVersion { get; set; }
    }
}
