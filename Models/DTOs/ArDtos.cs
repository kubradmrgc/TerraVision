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

    public class SaveArSessionRequestDto
    {
        public int ProductId { get; set; }
        public string DeviceModel { get; set; } = string.Empty;
        public decimal ScaleX { get; set; } = 1.0m;
        public decimal ScaleY { get; set; } = 1.0m;
        public decimal ScaleZ { get; set; } = 1.0m;
        public decimal RotationY { get; set; }
        public string? EnvironmentNotes { get; set; }
    }

    public class ArSessionResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? CustomerEmail { get; set; }
        public string? CustomerName { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductImageUrl { get; set; } = string.Empty;
        public string DeviceModel { get; set; } = string.Empty;
        public string ScreenshotUrl { get; set; } = string.Empty;
        public decimal ScaleX { get; set; }
        public decimal ScaleY { get; set; }
        public decimal ScaleZ { get; set; }
        public decimal RotationY { get; set; }
        public string EnvironmentMetadata { get; set; } = "{}";
        public DateTime CreatedDate { get; set; }
    }
}
