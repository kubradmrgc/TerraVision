namespace TerraVision.Api.Models.Realtime;

public sealed class CartAbandonedEvent
{
    public int UserId { get; set; }
    public int CartId { get; set; }
    public string CustomerEmail { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public DateTime LastActivityAtUtc { get; set; }
    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
}
