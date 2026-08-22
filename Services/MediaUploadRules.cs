namespace TerraVision.Api.Services;

public static class MediaUploadRules
{
    public static readonly HashSet<string> ArModelExtensions = [".gltf", ".glb", ".usdz"];
    public static readonly HashSet<string> ScreenshotExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    public static readonly HashSet<string> ProductImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    /// <summary>Aligned with mobile client (25MB AR upload cap).</summary>
    public const long MaxArModelSizeBytes = 25 * 1024 * 1024;
    public const long MaxScreenshotSizeBytes = 10 * 1024 * 1024;
    public const long MaxProductImageSizeBytes = 5 * 1024 * 1024;

    /// <summary>Kestrel / multipart ceiling (largest media type + multipart overhead).</summary>
    public static long MaxHttpRequestBodyBytes => MaxArModelSizeBytes + (512 * 1024);

    public const int HeaderInspectionBytes = 512;

    public static void Validate(string fileName, long contentLength, long maxBytes, HashSet<string> allowedExtensions, string extensionError)
    {
        if (contentLength <= 0)
        {
            throw new ArgumentException("File is empty.");
        }

        if (contentLength > maxBytes)
        {
            throw new ArgumentException("File size exceeds allowed limit.");
        }

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            throw new ArgumentException(extensionError);
        }
    }

    public static async Task ValidateUploadAsync(
        Stream content,
        string fileName,
        long contentLength,
        long maxBytes,
        HashSet<string> allowedExtensions,
        string extensionError,
        CancellationToken cancellationToken = default)
    {
        Validate(fileName, contentLength, maxBytes, allowedExtensions, extensionError);

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var buffer = new byte[Math.Min(HeaderInspectionBytes, (int)Math.Min(contentLength, HeaderInspectionBytes))];
        if (buffer.Length == 0)
        {
            throw new ArgumentException("File is empty.");
        }

        var read = await MediaFileSignatureValidator.ReadHeaderAsync(content, buffer, cancellationToken);
        MediaFileSignatureValidator.ValidateHeader(buffer.AsSpan(0, read), extension);
    }

    public static void ValidateHeaderForExtension(ReadOnlySpan<byte> header, string fileName, long contentLength, long maxBytes, HashSet<string> allowedExtensions, string extensionError)
    {
        Validate(fileName, contentLength, maxBytes, allowedExtensions, extensionError);
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        MediaFileSignatureValidator.ValidateHeader(header, extension);
    }

    public static string GetContentType(string extension) => extension switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        ".gltf" => "model/gltf+json",
        ".glb" => "model/gltf-binary",
        ".usdz" => "model/vnd.usdz+zip",
        _ => "application/octet-stream"
    };

    public static string BuildArModelFileName(string fileName) =>
        $"{Path.GetFileNameWithoutExtension(fileName)}-{Guid.NewGuid():N}{Path.GetExtension(fileName).ToLowerInvariant()}";

    public static string BuildScreenshotFileName(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = ".jpg";
        }

        return $"ar-session-{Guid.NewGuid():N}{extension}";
    }

    public static string BuildProductImageFileName(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = ".jpg";
        }

        return $"product-{Guid.NewGuid():N}{extension}";
    }
}
