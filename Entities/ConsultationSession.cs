using TerraVision.Api.Entities.Common;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Entities
{
    public class ConsultationSession : BaseEntity
    {
        public int CustomerId { get; set; }
        public virtual User Customer { get; set; } = null!;

        public int ConsultantId { get; set; }
        public virtual User Consultant { get; set; } = null!;

        public string Title { get; set; } = string.Empty;
        public ConsultationSessionStatus Status { get; set; } = ConsultationSessionStatus.Open;

        public int? AppointmentId { get; set; }
        public virtual Appointment? Appointment { get; set; }

        public virtual ICollection<ChatMessage> Messages { get; set; } = new HashSet<ChatMessage>();
    }
}
