using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface INotificationService
    {
        Task<NotificationDto> CreateAsync(
            int userId,
            NotificationType type,
            string title,
            string message,
            string? relatedEntityType = null,
            int? relatedEntityId = null,
            CancellationToken cancellationToken = default);

        Task<PagedResult<NotificationDto>> GetMyNotificationsAsync(
            int userId,
            NotificationListQuery query,
            CancellationToken cancellationToken = default);

        Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default);

        Task<int> MarkAsReadAsync(int userId, IReadOnlyCollection<int> notificationIds, CancellationToken cancellationToken = default);

        Task<int> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default);
    }
}
