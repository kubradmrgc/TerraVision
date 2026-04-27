using Microsoft.AspNetCore.SignalR;
using TerraVision.Api.Hubs;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.Realtime;

namespace TerraVision.Api.Services
{
    public class SignalRRealtimeSyncService : IRealtimeSyncService
    {
        private readonly IHubContext<TerraVisionHub> _hubContext;

        public SignalRRealtimeSyncService(IHubContext<TerraVisionHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task BroadcastCartChangedAsync(CartChangedEvent cartEvent)
        {
            var userGroup = TerraVisionHub.BuildUserGroup(cartEvent.UserId.ToString());
            await _hubContext.Clients.Group(userGroup)
                .SendAsync(TerraVisionHub.CartChangedEventName, cartEvent);
        }

        public async Task BroadcastOrderCreatedAsync(OrderCreatedEvent orderEvent)
        {
            var userGroup = TerraVisionHub.BuildUserGroup(orderEvent.UserId.ToString());
            await _hubContext.Clients.Group(userGroup)
                .SendAsync(TerraVisionHub.OrderCreatedEventName, orderEvent);
        }

        public async Task BroadcastOrderStatusChangedAsync(OrderStatusChangedEvent orderEvent)
        {
            var userGroup = TerraVisionHub.BuildUserGroup(orderEvent.UserId.ToString());
            await _hubContext.Clients.Group(userGroup)
                .SendAsync(TerraVisionHub.OrderStatusChangedEventName, orderEvent);
        }
    }
}
