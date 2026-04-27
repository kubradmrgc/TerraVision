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
    }
}
