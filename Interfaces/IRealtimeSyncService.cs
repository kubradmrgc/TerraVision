using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Models.Realtime;

namespace TerraVision.Api.Interfaces
{
    public interface IRealtimeSyncService
    {
        Task BroadcastCartChangedAsync(CartChangedEvent cartEvent);
        Task BroadcastOrderCreatedAsync(OrderCreatedEvent orderEvent);
        Task BroadcastOrderStatusChangedAsync(OrderStatusChangedEvent orderEvent);
        Task BroadcastArSessionCreatedAsync(ArSessionCreatedEvent arSessionEvent);
        Task BroadcastCartAbandonedAsync(CartAbandonedEvent cartEvent, CancellationToken cancellationToken = default);
        Task BroadcastProductLowStockAsync(ProductLowStockEvent lowStockEvent);
        Task BroadcastExchangeOfferReceivedAsync(ExchangeOfferReceivedEvent offerEvent);
        Task BroadcastExchangeOfferStatusChangedAsync(ExchangeOfferStatusChangedEvent offerEvent);
        Task BroadcastExchangeProductListedAsync(ExchangeProductDto product);
        Task BroadcastNotificationCreatedAsync(NotificationCreatedEvent notificationEvent);
        Task BroadcastChatMessageReceivedAsync(int sessionId, ChatMessageReceivedEvent chatEvent);
    }
}
