using Microsoft.Extensions.Options;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Services.Storage;

public class LocalMediaBlobStorage : IMediaBlobStorage
{
    private readonly IWebHostEnvironment _hostEnvironment;
    private readonly MediaStorageSettings _settings;

    public LocalMediaBlobStorage(IWebHostEnvironment hostEnvironment, IOptions<MediaStorageSettings> settings)
    {
        _hostEnvironment = hostEnvironment;
        _settings = settings.Value;
    }

    public async Task<MediaBlobUploadResult> UploadAsync(
        Stream content,
        string objectKey,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var webRoot = ResolveWebRootPath();
        var fullPath = Path.Combine(webRoot, "assets", objectKey.Replace('/', Path.DirectorySeparatorChar));
        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await using (var stream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write))
        {
            await content.CopyToAsync(stream, cancellationToken);
        }

        var size = new FileInfo(fullPath).Length;

        var publicUrl = GetPublicUrl(objectKey);
        return new MediaBlobUploadResult
        {
            ObjectKey = objectKey,
            PublicUrl = publicUrl,
            Size = size
        };
    }

    public string GetPublicUrl(string objectKey)
    {
        var normalizedKey = objectKey.TrimStart('/');
        if (!string.IsNullOrWhiteSpace(_settings.PublicBaseUrl))
        {
            return $"{_settings.PublicBaseUrl.TrimEnd('/')}/assets/{normalizedKey}";
        }

        return $"/assets/{normalizedKey}";
    }

    public string ResolveClientUrl(string? storedValue, string folderPrefix, string? fallbackFileName = null)
    {
        if (!string.IsNullOrWhiteSpace(storedValue))
        {
            if (storedValue.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                storedValue.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                return storedValue;
            }

            if (storedValue.StartsWith('/'))
            {
                return storedValue;
            }

            return GetPublicUrl($"{folderPrefix}/{storedValue}");
        }

        if (!string.IsNullOrWhiteSpace(fallbackFileName))
        {
            return GetPublicUrl($"{folderPrefix}/{fallbackFileName}");
        }

        return string.Empty;
    }

    private string ResolveWebRootPath()
    {
        var webRootPath = _hostEnvironment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(_hostEnvironment.ContentRootPath, "wwwroot");
        }

        return webRootPath;
    }
}
