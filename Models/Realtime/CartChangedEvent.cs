namespace TerraVision.Api.Models.Realtime
{
    public sealed class CartChangedEvent
    {
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public string Action { get; set; } = string.Empty;
        public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    }
}
