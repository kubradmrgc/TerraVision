using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Services;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Services.Storage;

public class S3MediaPresignService : IMediaPresignService
{
    private readonly IAmazonS3 _s3;
    private readonly IMediaBlobStorage _blobStorage;
    private readonly MediaStorageSettings _settings;

    public S3MediaPresignService(IAmazonS3 s3, IMediaBlobStorage blobStorage, IOptions<MediaStorageSettings> settings)
    {
        _s3 = s3;
        _blobStorage = blobStorage;
        _settings = settings.Value;
    }

    public MediaUploadCapabilitiesDto GetCapabilities() => new()
    {
        PresignedUpload = _settings.EnablePresignedUploads,
        Provider = "S3"
    };

    public Task<PresignUploadResponseDto> PresignArModelAsync(PresignUploadRequestDto request, CancellationToken cancellationToken = default)
    {
        MediaUploadRules.Validate(
            request.FileName,
            request.ContentLength,
            MediaUploadRules.MaxArModelSizeBytes,
            MediaUploadRules.ArModelExtensions,
            "Only .gltf, .glb and .usdz files are allowed.");

        var fileName = MediaUploadRules.BuildArModelFileName(request.FileName);
        var objectKey = $"{_settings.Prefixes.ArModels}/{fileName}";
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return Task.FromResult(BuildPresign(objectKey, fileName, MediaUploadRules.GetContentType(extension), request.ContentType));
    }

    public async Task<UploadArModelResponse> ConfirmArModelAsync(ConfirmPresignedUploadDto request, CancellationToken cancellationToken = default)
    {
        var (size, publicUrl) = await VerifyObjectAsync(request, _settings.Prefixes.ArModels, cancellationToken);
        return new UploadArModelResponse
        {
            FileName = request.FileName,
            Url = publicUrl,
            Size = size
        };
    }

    public Task<PresignUploadResponseDto> PresignArScreenshotAsync(PresignUploadRequestDto request, CancellationToken cancellationToken = default)
    {
        MediaUploadRules.Validate(
            request.FileName,
            request.ContentLength,
            MediaUploadRules.MaxScreenshotSizeBytes,
            MediaUploadRules.ScreenshotExtensions,
            "Only .jpg, .jpeg, .png and .webp screenshots are allowed.");

        var fileName = MediaUploadRules.BuildScreenshotFileName(request.FileName);
        var objectKey = $"{_settings.Prefixes.ArScreenshots}/{fileName}";
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return Task.FromResult(BuildPresign(objectKey, fileName, MediaUploadRules.GetContentType(extension), request.ContentType));
    }

    public async Task<UploadArScreenshotResponse> ConfirmArScreenshotAsync(ConfirmPresignedUploadDto request, CancellationToken cancellationToken = default)
    {
        var (size, publicUrl) = await VerifyObjectAsync(request, _settings.Prefixes.ArScreenshots, cancellationToken);
        return new UploadArScreenshotResponse
        {
            FileName = request.FileName,
            Url = publicUrl,
            Size = size
        };
    }

    public Task<PresignUploadResponseDto> PresignProductImageAsync(PresignUploadRequestDto request, CancellationToken cancellationToken = default)
    {
        MediaUploadRules.Validate(
            request.FileName,
            request.ContentLength,
            MediaUploadRules.MaxProductImageSizeBytes,
            MediaUploadRules.ProductImageExtensions,
            "Only .jpg, .jpeg, .png and .webp images are allowed.");

        var fileName = MediaUploadRules.BuildProductImageFileName(request.FileName);
        var objectKey = $"{_settings.Prefixes.ProductImages}/{fileName}";
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return Task.FromResult(BuildPresign(objectKey, fileName, MediaUploadRules.GetContentType(extension), request.ContentType));
    }

    public async Task<UploadProductImageResponse> ConfirmProductImageAsync(ConfirmPresignedUploadDto request, CancellationToken cancellationToken = default)
    {
        var (size, publicUrl) = await VerifyObjectAsync(request, _settings.Prefixes.ProductImages, cancellationToken);
        return new UploadProductImageResponse
        {
            FileName = request.FileName,
            Url = publicUrl,
            Size = size
        };
    }

    private PresignUploadResponseDto BuildPresign(string objectKey, string fileName, string contentType, string? clientContentType)
    {
        if (!_settings.EnablePresignedUploads)
        {
            return new PresignUploadResponseDto { Supported = false };
        }

        var expires = DateTime.UtcNow.AddMinutes(Math.Clamp(_settings.PresignExpiryMinutes, 5, 60));
        var uploadUrl = _s3.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _settings.S3.Bucket,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            Expires = expires,
            ContentType = contentType
        });

        return new PresignUploadResponseDto
        {
            Supported = true,
            Presign = new PresignUploadDetailsDto
            {
                UploadUrl = uploadUrl,
                Method = "PUT",
                Headers = new Dictionary<string, string>
                {
                    ["Content-Type"] = string.IsNullOrWhiteSpace(clientContentType) ? contentType : clientContentType
                },
                ObjectKey = objectKey,
                FileName = fileName,
                PublicUrl = _blobStorage.GetPublicUrl(objectKey),
                ExpiresAtUtc = expires
            }
        };
    }

    private async Task<(long Size, string PublicUrl)> VerifyObjectAsync(
        ConfirmPresignedUploadDto request,
        string expectedPrefix,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ObjectKey) || string.IsNullOrWhiteSpace(request.FileName))
        {
            throw new ArgumentException("ObjectKey and FileName are required.");
        }

        var normalizedKey = request.ObjectKey.TrimStart('/');
        if (!normalizedKey.StartsWith($"{expectedPrefix}/", StringComparison.Ordinal))
        {
            throw new ArgumentException("Invalid object key for this upload type.");
        }

            var rules = ResolveUploadRules(expectedPrefix, _settings.Prefixes);

        try
        {
            var metadata = await _s3.GetObjectMetadataAsync(_settings.S3.Bucket, normalizedKey, cancellationToken);
            var size = request.ContentLength ?? metadata.ContentLength;
            MediaUploadRules.Validate(
                request.FileName,
                size,
                rules.MaxBytes,
                rules.Extensions,
                rules.ExtensionError);

            var header = await ReadObjectHeaderAsync(normalizedKey, cancellationToken);
            MediaFileSignatureValidator.ValidateHeader(header, Path.GetExtension(request.FileName).ToLowerInvariant());

            return (size, _blobStorage.GetPublicUrl(normalizedKey));
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            throw new InvalidOperationException("Uploaded object was not found. Complete the PUT upload before confirming.");
        }
    }

    private async Task<byte[]> ReadObjectHeaderAsync(string objectKey, CancellationToken cancellationToken)
    {
        using var response = await _s3.GetObjectAsync(new GetObjectRequest
        {
            BucketName = _settings.S3.Bucket,
            Key = objectKey
        }, cancellationToken);

        var buffer = new byte[MediaUploadRules.HeaderInspectionBytes];
        var offset = 0;
        while (offset < buffer.Length)
        {
            var read = await response.ResponseStream.ReadAsync(buffer.AsMemory(offset), cancellationToken);
            if (read == 0)
            {
                break;
            }

            offset += read;
        }

        return buffer[..offset];
    }

    private static (long MaxBytes, HashSet<string> Extensions, string ExtensionError) ResolveUploadRules(
        string prefix,
        MediaStoragePrefixes configuredPrefixes)
    {
        if (string.Equals(prefix, configuredPrefixes.ArModels, StringComparison.Ordinal))
        {
            return (
                MediaUploadRules.MaxArModelSizeBytes,
                MediaUploadRules.ArModelExtensions,
                "Only .gltf, .glb and .usdz files are allowed.");
        }

        if (string.Equals(prefix, configuredPrefixes.ArScreenshots, StringComparison.Ordinal))
        {
            return (
                MediaUploadRules.MaxScreenshotSizeBytes,
                MediaUploadRules.ScreenshotExtensions,
                "Only .jpg, .jpeg, .png and .webp screenshots are allowed.");
        }

        if (string.Equals(prefix, configuredPrefixes.ProductImages, StringComparison.Ordinal))
        {
            return (
                MediaUploadRules.MaxProductImageSizeBytes,
                MediaUploadRules.ProductImageExtensions,
                "Only .jpg, .jpeg, .png and .webp images are allowed.");
        }

        throw new ArgumentException("Invalid object key for this upload type.");
    }
}
