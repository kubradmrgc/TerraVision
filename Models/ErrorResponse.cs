namespace TerraVision.Api.Models
{
    public class ErrorResponse
    {
        public bool Success { get; set; } = false;
        public string Message { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        // Opsiyonel olarak hata detayları, validasyon hataları vb. tutulabilir
        public object? Errors { get; set; }
    }
}
