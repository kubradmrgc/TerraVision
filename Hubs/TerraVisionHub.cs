using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

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

        public static string AdminDashboardGroup => "admins";

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

        public static string BuildUserGroup(string userId) => $"user:{userId}";
    }
}
