using TerraVision.Api.Entities.Common;

namespace TerraVision.Api.Entities
{
    public class ArSession : BaseEntity
    {
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public string DeviceModel { get; set; } = string.Empty;
        public string ScreenshotUrl { get; set; } = string.Empty;
        public decimal ScaleX { get; set; }
        public decimal ScaleY { get; set; }
        public decimal ScaleZ { get; set; }
        public decimal RotationY { get; set; }
        public string EnvironmentMetadata { get; set; } = "{}";

        public virtual User User { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
    }
}
