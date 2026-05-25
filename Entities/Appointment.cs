using System.ComponentModel.DataAnnotations;
using TerraVision.Api.Entities.Common;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Entities
{
    public class Appointment : BaseEntity
    {
        public int CustomerId { get; set; }
        public virtual User Customer { get; set; } = null!;

        public int ConsultantId { get; set; }
        public virtual User Consultant { get; set; } = null!;

        public DateTime AppointmentDate { get; set; }
        public string Notes { get; set; } = string.Empty;
        public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;

        public AppointmentOutcome Outcome { get; set; } = AppointmentOutcome.None;

        /// <summary>Order placed by the customer after this visit (explicit conversion link).</summary>
        public int? LinkedOrderId { get; set; }
        public virtual Order? LinkedOrder { get; set; }

        /// <summary>Customer satisfaction 1–5, recorded at visit close-out.</summary>
        public int? SatisfactionScore { get; set; }

        public string? OutcomeNotes { get; set; }
        public DateTime? OutcomeRecordedAt { get; set; }
        public int? OutcomeRecordedByUserId { get; set; }

        /// <summary>SQL Server rowversion for optimistic concurrency on status updates.</summary>
        [Timestamp]
        public byte[] RowVersion { get; set; } = null!;
    }
}