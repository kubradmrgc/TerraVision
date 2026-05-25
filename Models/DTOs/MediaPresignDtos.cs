namespace TerraVision.Api.Models.DTOs;

public class MediaUploadCapabilitiesDto
{
    public bool PresignedUpload { get; init; }
    public string Provider { get; init; } = "Local";
}

public class PresignUploadRequestDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long ContentLength { get; set; }
}

public class PresignUploadResponseDto
{
    public bool Supported { get; init; }
    public PresignUploadDetailsDto? Presign { get; init; }
}

public class PresignUploadDetailsDto
{
    public string UploadUrl { get; init; } = string.Empty;
    public string Method { get; init; } = "PUT";
    public Dictionary<string, string> Headers { get; init; } = new();
    public string ObjectKey { get; init; } = string.Empty;
    public string FileName { get; init; } = string.Empty;
    public string PublicUrl { get; init; } = string.Empty;
    public DateTime ExpiresAtUtc { get; init; }
}

public class ConfirmPresignedUploadDto
{
    public string ObjectKey { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long? ContentLength { get; set; }
}
