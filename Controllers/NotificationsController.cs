using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyNotifications([FromQuery] NotificationListQuery query, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            var result = await _notificationService.GetMyNotificationsAsync(userId, query, cancellationToken);
            return Ok(result);
        }

        [HttpGet("me/unread-count")]
        public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            var count = await _notificationService.GetUnreadCountAsync(userId, cancellationToken);
            return Ok(new UnreadNotificationCountDto { UnreadCount = count });
        }

        [HttpPost("me/read")]
        public async Task<IActionResult> MarkAsRead([FromBody] MarkNotificationsReadRequest request, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            var updated = await _notificationService.MarkAsReadAsync(userId, request.NotificationIds, cancellationToken);
            return Ok(new { updated });
        }

        [HttpPost("me/read-all")]
        public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            var updated = await _notificationService.MarkAllAsReadAsync(userId, cancellationToken);
            return Ok(new { updated });
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user identity.");
            }

            return userId;
        }
    }
}
