namespace TerraVision.Api.Models.DTOs
{
    public class UploadArModelResponse
    {
        public string FileName { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public long Size { get; set; }
    }
}
