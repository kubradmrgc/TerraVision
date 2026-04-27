namespace TerraVision.Api.Models.DTOs
{
    public class ArPreviewResponse
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ModelUrl { get; set; } = string.Empty;
        public string ModelFormat { get; set; } = string.Empty;
        public string PlacementHint { get; set; } = "ground";
        public decimal SuggestedScale { get; set; } = 1.0m;
    }
}
