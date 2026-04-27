using TerraVision.Api.Models.Realtime;

namespace TerraVision.Api.Interfaces
{
    public interface IRealtimeSyncService
    {
        Task BroadcastCartChangedAsync(CartChangedEvent cartEvent);
        Task BroadcastOrderCreatedAsync(OrderCreatedEvent orderEvent);
        Task BroadcastOrderStatusChangedAsync(OrderStatusChangedEvent orderEvent);
    }
}
