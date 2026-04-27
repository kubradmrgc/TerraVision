using TerraVision.Api.Enums;

namespace TerraVision.Api.Models.Realtime
{
    public sealed class OrderStatusChangedEvent
    {
        public int UserId { get; set; }
        public int OrderId { get; set; }
        public OrderStatus PreviousStatus { get; set; }
        public OrderStatus NewStatus { get; set; }
        public int? UpdatedByUserId { get; set; }
        public string? UpdatedReason { get; set; }
        public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    }
}
