namespace TerraVision.Api.Models.Realtime
{
    public class ProductLowStockEvent
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public int MinStockLevel { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime OccurredAtUtc { get; set; }
    }
}
