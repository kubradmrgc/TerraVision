using Microsoft.AspNetCore.SignalR;
using TerraVision.Api.Hubs;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
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

        public async Task BroadcastArSessionCreatedAsync(ArSessionCreatedEvent arSessionEvent)
        {
            await _hubContext.Clients.Group(TerraVisionHub.AdminDashboardGroup)
                .SendAsync(TerraVisionHub.ArSessionCreatedEventName, arSessionEvent);
        }

        public async Task BroadcastCartAbandonedAsync(CartAbandonedEvent cartEvent, CancellationToken cancellationToken = default)
        {
            var userGroup = TerraVisionHub.BuildUserGroup(cartEvent.UserId.ToString());
            await _hubContext.Clients.Group(userGroup)
                .SendAsync(TerraVisionHub.CartAbandonedEventName, cartEvent, cancellationToken);
        }

        public async Task BroadcastProductLowStockAsync(ProductLowStockEvent lowStockEvent)
        {
            await _hubContext.Clients.Group(TerraVisionHub.AdminDashboardGroup)
                .SendAsync(TerraVisionHub.ProductLowStockEventName, lowStockEvent);
        }

        public async Task BroadcastExchangeOfferReceivedAsync(ExchangeOfferReceivedEvent offerEvent)
        {
            var userGroup = TerraVisionHub.BuildUserGroup(offerEvent.OwnerId.ToString());
            await _hubContext.Clients.Group(userGroup)
                .SendAsync(TerraVisionHub.ExchangeOfferReceivedEventName, offerEvent);
        }

        public async Task BroadcastExchangeOfferStatusChangedAsync(ExchangeOfferStatusChangedEvent offerEvent)
        {
            var userGroup = TerraVisionHub.BuildUserGroup(offerEvent.SenderId.ToString());
            await _hubContext.Clients.Group(userGroup)
                .SendAsync(TerraVisionHub.ExchangeOfferStatusChangedEventName, offerEvent);
        }

        public async Task BroadcastExchangeProductListedAsync(ExchangeProductDto product)
        {
            await _hubContext.Clients.All.SendAsync(
                TerraVisionHub.ExchangeProductListedEventName,
                new ExchangeProductListedEvent { Product = product });
        }

        public async Task BroadcastNotificationCreatedAsync(NotificationCreatedEvent notificationEvent)
        {
            var userGroup = TerraVisionHub.BuildUserGroup(notificationEvent.UserId.ToString());
            await _hubContext.Clients.Group(userGroup)
                .SendAsync(TerraVisionHub.NotificationCreatedEventName, notificationEvent);
        }
    }
}
