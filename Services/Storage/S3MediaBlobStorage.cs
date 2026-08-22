using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Services.Storage;

public class S3MediaBlobStorage : IMediaBlobStorage
{
    private readonly IAmazonS3 _s3;
    private readonly MediaStorageSettings _settings;

    public S3MediaBlobStorage(IAmazonS3 s3, IOptions<MediaStorageSettings> settings)
    {
        _s3 = s3;
        _settings = settings.Value;
    }

    public async Task<MediaBlobUploadResult> UploadAsync(
        Stream content,
        string objectKey,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var normalizedKey = objectKey.TrimStart('/');
        var request = new PutObjectRequest
        {
            BucketName = _settings.S3.Bucket,
            Key = normalizedKey,
            InputStream = content,
            ContentType = contentType,
            AutoCloseStream = false
        };

        await _s3.PutObjectAsync(request, cancellationToken);
        var size = content.CanSeek ? content.Length : 0;

        return new MediaBlobUploadResult
        {
            ObjectKey = normalizedKey,
            PublicUrl = GetPublicUrl(normalizedKey),
            Size = size
        };
    }

    public string GetPublicUrl(string objectKey)
    {
        var normalizedKey = objectKey.TrimStart('/');
        if (!string.IsNullOrWhiteSpace(_settings.PublicBaseUrl))
        {
            return $"{_settings.PublicBaseUrl.TrimEnd('/')}/{normalizedKey}";
        }

        if (!string.IsNullOrWhiteSpace(_settings.S3.ServiceUrl))
        {
            var baseUrl = _settings.S3.ServiceUrl.TrimEnd('/');
            return _settings.S3.ForcePathStyle
                ? $"{baseUrl}/{_settings.S3.Bucket}/{normalizedKey}"
                : $"{baseUrl}/{normalizedKey}";
        }

        var region = string.IsNullOrWhiteSpace(_settings.S3.Region) ? "us-east-1" : _settings.S3.Region;
        return $"https://{_settings.S3.Bucket}.s3.{region}.amazonaws.com/{normalizedKey}";
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
                var key = storedValue.TrimStart('/').Replace("assets/", string.Empty, StringComparison.Ordinal);
                return GetPublicUrl(key);
            }

            return GetPublicUrl($"{folderPrefix}/{storedValue}");
        }

        if (!string.IsNullOrWhiteSpace(fallbackFileName))
        {
            return GetPublicUrl($"{folderPrefix}/{fallbackFileName}");
        }

        return string.Empty;
    }
}
