using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Models.Realtime
{
    public sealed class NotificationCreatedEvent
    {
        public int UserId { get; set; }
        public NotificationDto Notification { get; set; } = null!;
        public int UnreadCount { get; set; }
        public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    }
}
