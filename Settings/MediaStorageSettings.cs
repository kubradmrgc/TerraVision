namespace TerraVision.Api.Settings;

public class MediaStorageSettings
{
    public const string SectionName = "MediaStorage";

    /// <summary>Local (wwwroot) or S3 (AWS S3 / MinIO / Azure Blob via S3 API).</summary>
    public string Provider { get; set; } = "Local";

    /// <summary>
    /// Public HTTPS base URL for object keys (e.g. https://cdn.example.com).
    /// Required for native AR preview when using Local storage (relative /assets paths are not reachable from devices).
    /// When empty, Local uses relative /assets paths; S3 uses virtual-host style HTTPS URLs.
    /// </summary>
    public string? PublicBaseUrl { get; set; }

    public bool EnablePresignedUploads { get; set; } = true;

    public int PresignExpiryMinutes { get; set; } = 15;

    public MediaStoragePrefixes Prefixes { get; set; } = new();

    public S3MediaStorageSettings S3 { get; set; } = new();
}

public class MediaStoragePrefixes
{
    public string ArModels { get; set; } = "ar-models";
    public string ArScreenshots { get; set; } = "ar-sessions";
    public string ProductImages { get; set; } = "product-images";
    public string ExchangeImages { get; set; } = "exchange-images";
}

public class S3MediaStorageSettings
{
    public string Bucket { get; set; } = "terravision-media";
    public string Region { get; set; } = "eu-west-1";
    public string? AccessKey { get; set; }
    public string? SecretKey { get; set; }

    /// <summary>Custom endpoint for MinIO / Azure Blob S3 API (e.g. http://localhost:9000).</summary>
    public string? ServiceUrl { get; set; }

    public bool ForcePathStyle { get; set; } = true;
}
