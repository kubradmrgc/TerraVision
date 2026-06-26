using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TerraVision.Api.Extensions;

namespace TerraVision.Api.Hubs
{
    [Authorize]
    public class TerraVisionHub : Hub
    {
        public const string CartChangedEventName = "cart.changed";
        public const string OrderCreatedEventName = "order.created";
        public const string OrderStatusChangedEventName = "order.status.changed";

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.GetUserIdValue();
            if (!string.IsNullOrWhiteSpace(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, BuildUserGroup(userId));
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.GetUserIdValue();
            if (!string.IsNullOrWhiteSpace(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, BuildUserGroup(userId));
            }

            await base.OnDisconnectedAsync(exception);
        }

        public static string BuildUserGroup(string userId) => $"user:{userId}";
    }
}
