using TerraVision.Api.Entities.Common;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Entities
{
    public class Notification : BaseEntity
    {
        /// <summary>Recipient of the notification.</summary>
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public NotificationType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;

        /// <summary>Domain entity the notification points to (e.g. "Order", "Appointment", "ExchangeOffer").</summary>
        public string? RelatedEntityType { get; set; }
        public int? RelatedEntityId { get; set; }

        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
    }
}
