using Microsoft.Extensions.Options;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Services;

public class MediaService : IMediaService
{
    private readonly IMediaBlobStorage _blobStorage;
    private readonly MediaStorageSettings _settings;

    public MediaService(IMediaBlobStorage blobStorage, IOptions<MediaStorageSettings> settings)
    {
        _blobStorage = blobStorage;
        _settings = settings.Value;
    }

    public async Task<UploadArModelResponse> UploadArModelAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        var generatedFileName = MediaUploadRules.BuildArModelFileName(file.FileName);
        var objectKey = $"{_settings.Prefixes.ArModels}/{generatedFileName}";
        var extension = Path.GetExtension(generatedFileName).ToLowerInvariant();

        await using var stream = file.OpenReadStream();
        await MediaUploadRules.ValidateUploadAsync(
            stream,
            generatedFileName,
            file.Length,
            MediaUploadRules.MaxArModelSizeBytes,
            MediaUploadRules.ArModelExtensions,
            "Only .gltf, .glb and .usdz files are allowed.",
            cancellationToken);

        var uploaded = await _blobStorage.UploadAsync(stream, objectKey, MediaUploadRules.GetContentType(extension), cancellationToken);

        return new UploadArModelResponse
        {
            FileName = generatedFileName,
            Url = uploaded.PublicUrl,
            Size = file.Length
        };
    }

    public async Task<UploadArScreenshotResponse> UploadArScreenshotAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        var generatedFileName = MediaUploadRules.BuildScreenshotFileName(file.FileName);
        var objectKey = $"{_settings.Prefixes.ArScreenshots}/{generatedFileName}";
        var extension = Path.GetExtension(generatedFileName).ToLowerInvariant();

        await using var stream = file.OpenReadStream();
        await MediaUploadRules.ValidateUploadAsync(
            stream,
            generatedFileName,
            file.Length,
            MediaUploadRules.MaxScreenshotSizeBytes,
            MediaUploadRules.ScreenshotExtensions,
            "Only .jpg, .jpeg, .png and .webp screenshots are allowed.",
            cancellationToken);

        var uploaded = await _blobStorage.UploadAsync(stream, objectKey, MediaUploadRules.GetContentType(extension), cancellationToken);

        return new UploadArScreenshotResponse
        {
            FileName = generatedFileName,
            Url = uploaded.PublicUrl,
            Size = file.Length
        };
    }

    public async Task<UploadProductImageResponse> UploadProductImageAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        var generatedFileName = MediaUploadRules.BuildProductImageFileName(file.FileName);
        var objectKey = $"{_settings.Prefixes.ProductImages}/{generatedFileName}";
        var extension = Path.GetExtension(generatedFileName).ToLowerInvariant();

        await using var stream = file.OpenReadStream();
        await MediaUploadRules.ValidateUploadAsync(
            stream,
            generatedFileName,
            file.Length,
            MediaUploadRules.MaxProductImageSizeBytes,
            MediaUploadRules.ProductImageExtensions,
            "Only .jpg, .jpeg, .png and .webp images are allowed.",
            cancellationToken);

        var uploaded = await _blobStorage.UploadAsync(stream, objectKey, MediaUploadRules.GetContentType(extension), cancellationToken);

        return new UploadProductImageResponse
        {
            FileName = generatedFileName,
            Url = uploaded.PublicUrl,
            Size = file.Length
        };
    }

    public async Task<UploadProductImageResponse> UploadExchangeImageAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        var generatedFileName = MediaUploadRules.BuildProductImageFileName(file.FileName);
        var objectKey = $"{_settings.Prefixes.ExchangeImages}/{generatedFileName}";
        var extension = Path.GetExtension(generatedFileName).ToLowerInvariant();

        await using var stream = file.OpenReadStream();
        await MediaUploadRules.ValidateUploadAsync(
            stream,
            generatedFileName,
            file.Length,
            MediaUploadRules.MaxProductImageSizeBytes,
            MediaUploadRules.ProductImageExtensions,
            "Only .jpg, .jpeg, .png and .webp images are allowed.",
            cancellationToken);

        var uploaded = await _blobStorage.UploadAsync(stream, objectKey, MediaUploadRules.GetContentType(extension), cancellationToken);

        return new UploadProductImageResponse
        {
            FileName = generatedFileName,
            Url = uploaded.PublicUrl,
            Size = file.Length
        };
    }
}
