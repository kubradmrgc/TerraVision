using TerraVision.Api.Enums;

namespace TerraVision.Api.Models.Realtime
{
    public sealed class OrderCreatedEvent
    {
        public int UserId { get; set; }
        public int OrderId { get; set; }
        public OrderStatus Status { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    }
}
