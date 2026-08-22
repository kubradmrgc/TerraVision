using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Models.Realtime;

namespace TerraVision.Api.Services
{
    public class NotificationService : INotificationService
    {
        private readonly TerraVisionDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRealtimeSyncService _realtimeSyncService;

        public NotificationService(
            TerraVisionDbContext dbContext,
            IUnitOfWork unitOfWork,
            IRealtimeSyncService realtimeSyncService)
        {
            _dbContext = dbContext;
            _unitOfWork = unitOfWork;
            _realtimeSyncService = realtimeSyncService;
        }

        public async Task<NotificationDto> CreateAsync(
            int userId,
            NotificationType type,
            string title,
            string message,
            string? relatedEntityType = null,
            int? relatedEntityId = null,
            CancellationToken cancellationToken = default)
        {
            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                RelatedEntityType = relatedEntityType,
                RelatedEntityId = relatedEntityId,
                IsRead = false,
                CreatedDate = DateTime.UtcNow
            };

            await _dbContext.Notifications.AddAsync(notification, cancellationToken);
            await _unitOfWork.CommitAsync();

            var dto = MapToDto(notification);
            var unreadCount = await GetUnreadCountAsync(userId, cancellationToken);

            await _realtimeSyncService.BroadcastNotificationCreatedAsync(new NotificationCreatedEvent
            {
                UserId = userId,
                Notification = dto,
                UnreadCount = unreadCount,
                OccurredAtUtc = DateTime.UtcNow
            });

            return dto;
        }

        public async Task<PagedResult<NotificationDto>> GetMyNotificationsAsync(
            int userId,
            NotificationListQuery query,
            CancellationToken cancellationToken = default)
        {
            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize is < 1 or > 100 ? 20 : query.PageSize;

            var baseQuery = _dbContext.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId && !n.IsDeleted);

            if (query.UnreadOnly)
            {
                baseQuery = baseQuery.Where(n => !n.IsRead);
            }

            var totalCount = await baseQuery.CountAsync(cancellationToken);
            var items = await baseQuery
                .OrderByDescending(n => n.CreatedDate)
                .ThenByDescending(n => n.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Type = n.Type,
                    Title = n.Title,
                    Message = n.Message,
                    RelatedEntityType = n.RelatedEntityType,
                    RelatedEntityId = n.RelatedEntityId,
                    IsRead = n.IsRead,
                    ReadAt = n.ReadAt,
                    CreatedDate = n.CreatedDate
                })
                .ToListAsync(cancellationToken);

            return new PagedResult<NotificationDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default)
        {
            return _dbContext.Notifications
                .AsNoTracking()
                .CountAsync(n => n.UserId == userId && !n.IsDeleted && !n.IsRead, cancellationToken);
        }

        public async Task<int> MarkAsReadAsync(int userId, IReadOnlyCollection<int> notificationIds, CancellationToken cancellationToken = default)
        {
            if (notificationIds == null || notificationIds.Count == 0)
            {
                return 0;
            }

            var ids = notificationIds.Distinct().ToList();
            var notifications = await _dbContext.Notifications
                .Where(n => n.UserId == userId && !n.IsDeleted && !n.IsRead && ids.Contains(n.Id))
                .ToListAsync(cancellationToken);

            if (notifications.Count == 0)
            {
                return 0;
            }

            var now = DateTime.UtcNow;
            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = now;
                notification.UpdatedDate = now;
            }

            await _unitOfWork.CommitAsync();
            return notifications.Count;
        }

        public async Task<int> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default)
        {
            var notifications = await _dbContext.Notifications
                .Where(n => n.UserId == userId && !n.IsDeleted && !n.IsRead)
                .ToListAsync(cancellationToken);

            if (notifications.Count == 0)
            {
                return 0;
            }

            var now = DateTime.UtcNow;
            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = now;
                notification.UpdatedDate = now;
            }

            await _unitOfWork.CommitAsync();
            return notifications.Count;
        }

        private static NotificationDto MapToDto(Notification notification) => new()
        {
            Id = notification.Id,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            RelatedEntityType = notification.RelatedEntityType,
            RelatedEntityId = notification.RelatedEntityId,
            IsRead = notification.IsRead,
            ReadAt = notification.ReadAt,
            CreatedDate = notification.CreatedDate
        };
    }
}
