using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TerraVision.Api.Interfaces;

namespace TerraVision.Api.Hubs
{
    [Authorize]
    public class TerraVisionHub : Hub
    {
        public const string CartChangedEventName = "cart.changed";
        public const string OrderCreatedEventName = "order.created";
        public const string OrderStatusChangedEventName = "order.status.changed";
        public const string ArSessionCreatedEventName = "ar.session.created";
        public const string ProductLowStockEventName = "product.low.stock";
        public const string CartAbandonedEventName = "customer.cart.abandoned";
        public const string ExchangeOfferReceivedEventName = "exchange.offer.received";
        public const string ExchangeOfferStatusChangedEventName = "exchange.offer.status.changed";
        public const string ExchangeProductListedEventName = "exchange.product.listed";
        public const string NotificationCreatedEventName = "notification.created";
        public const string ChatMessageReceivedEventName = "chat.message.received";

        public static string AdminDashboardGroup => "admins";

        private readonly IChatService _chatService;

        public TerraVisionHub(IChatService chatService)
        {
            _chatService = chatService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst("sub")?.Value;
            if (!string.IsNullOrWhiteSpace(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, BuildUserGroup(userId));
            }

            var role = Context.User?.FindFirst("role")?.Value;
            if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, AdminDashboardGroup);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst("sub")?.Value;
            if (!string.IsNullOrWhiteSpace(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, BuildUserGroup(userId));
            }

            var role = Context.User?.FindFirst("role")?.Value;
            if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, AdminDashboardGroup);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinChatSession(int sessionId)
        {
            var userId = GetCurrentUserId();
            await _chatService.EnsureParticipantAsync(sessionId, userId);
            await Groups.AddToGroupAsync(Context.ConnectionId, BuildChatGroup(sessionId));
        }

        public async Task LeaveChatSession(int sessionId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, BuildChatGroup(sessionId));
        }

        public async Task SendMessage(int sessionId, string content)
        {
            var senderId = GetCurrentUserId();
            await _chatService.EnsureParticipantAsync(sessionId, senderId);
            await Groups.AddToGroupAsync(Context.ConnectionId, BuildChatGroup(sessionId));
            await _chatService.SendMessageAsync(sessionId, senderId, content);
        }

        public static string BuildUserGroup(string userId) => $"user:{userId}";

        public static string BuildChatGroup(int sessionId) => $"chat:{sessionId}";

        private int GetCurrentUserId()
        {
            var sub = Context.User?.FindFirst("sub")?.Value;
            if (string.IsNullOrWhiteSpace(sub) || !int.TryParse(sub, out var userId))
            {
                throw new HubException("Kimlik doğrulaması gerekli.");
            }

            return userId;
        }
    }
}
