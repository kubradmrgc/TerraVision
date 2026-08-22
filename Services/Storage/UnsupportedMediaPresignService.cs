using Microsoft.Extensions.Options;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Services.Storage;

public class UnsupportedMediaPresignService : IMediaPresignService
{
    private readonly MediaStorageSettings _settings;

    public UnsupportedMediaPresignService(IOptions<MediaStorageSettings> settings)
    {
        _settings = settings.Value;
    }

    public MediaUploadCapabilitiesDto GetCapabilities() => new()
    {
        PresignedUpload = false,
        Provider = _settings.Provider
    };

    public Task<PresignUploadResponseDto> PresignArModelAsync(PresignUploadRequestDto request, CancellationToken cancellationToken = default) =>
        Task.FromResult(Unsupported());

    public Task<UploadArModelResponse> ConfirmArModelAsync(ConfirmPresignedUploadDto request, CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Presigned uploads require MediaStorage:Provider=S3.");

    public Task<PresignUploadResponseDto> PresignArScreenshotAsync(PresignUploadRequestDto request, CancellationToken cancellationToken = default) =>
        Task.FromResult(Unsupported());

    public Task<UploadArScreenshotResponse> ConfirmArScreenshotAsync(ConfirmPresignedUploadDto request, CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Presigned uploads require MediaStorage:Provider=S3.");

    public Task<PresignUploadResponseDto> PresignProductImageAsync(PresignUploadRequestDto request, CancellationToken cancellationToken = default) =>
        Task.FromResult(Unsupported());

    public Task<UploadProductImageResponse> ConfirmProductImageAsync(ConfirmPresignedUploadDto request, CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("Presigned uploads require MediaStorage:Provider=S3.");

    private static PresignUploadResponseDto Unsupported() => new() { Supported = false };
}
