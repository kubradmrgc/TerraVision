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
            if (Context.User.TryGetUserId(out var userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, BuildUserGroup(userId.ToString()));
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (Context.User.TryGetUserId(out var userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, BuildUserGroup(userId.ToString()));
            }

            await base.OnDisconnectedAsync(exception);
        }

        public static string BuildUserGroup(string userId) => $"user:{userId}";
    }
}
