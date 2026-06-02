using System.ComponentModel.DataAnnotations;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Models.DTOs
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public NotificationType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? RelatedEntityType { get; set; }
        public int? RelatedEntityId { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class NotificationListQuery
    {
        [Range(1, int.MaxValue)]
        public int Page { get; set; } = 1;
        [Range(1, 100)]
        public int PageSize { get; set; } = 20;
        public bool UnreadOnly { get; set; }
    }

    public class MarkNotificationsReadRequest
    {
        [Required]
        [MinLength(1)]
        public List<int> NotificationIds { get; set; } = [];
    }

    public class UnreadNotificationCountDto
    {
        public int UnreadCount { get; set; }
    }
}
