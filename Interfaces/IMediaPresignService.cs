using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces;

public interface IMediaPresignService
{
    MediaUploadCapabilitiesDto GetCapabilities();

    Task<PresignUploadResponseDto> PresignArModelAsync(PresignUploadRequestDto request, CancellationToken cancellationToken = default);

    Task<UploadArModelResponse> ConfirmArModelAsync(ConfirmPresignedUploadDto request, CancellationToken cancellationToken = default);

    Task<PresignUploadResponseDto> PresignArScreenshotAsync(PresignUploadRequestDto request, CancellationToken cancellationToken = default);

    Task<UploadArScreenshotResponse> ConfirmArScreenshotAsync(ConfirmPresignedUploadDto request, CancellationToken cancellationToken = default);

    Task<PresignUploadResponseDto> PresignProductImageAsync(PresignUploadRequestDto request, CancellationToken cancellationToken = default);

    Task<UploadProductImageResponse> ConfirmProductImageAsync(ConfirmPresignedUploadDto request, CancellationToken cancellationToken = default);
}
