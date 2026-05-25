namespace TerraVision.Api.Models.Realtime
{
    public class ArSessionCreatedEvent
    {
        public int SessionId { get; set; }
        public int UserId { get; set; }
        public string CustomerEmail { get; set; } = string.Empty;
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ScreenshotUrl { get; set; } = string.Empty;
        public decimal ScaleX { get; set; }
        public decimal ScaleY { get; set; }
        public decimal ScaleZ { get; set; }
        public DateTime OccurredAtUtc { get; set; }
    }
}
