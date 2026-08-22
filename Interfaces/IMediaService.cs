using Microsoft.AspNetCore.Http;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface IMediaService
    {
        Task<UploadArModelResponse> UploadArModelAsync(IFormFile file, CancellationToken cancellationToken = default);
        Task<UploadArScreenshotResponse> UploadArScreenshotAsync(IFormFile file, CancellationToken cancellationToken = default);
        Task<UploadProductImageResponse> UploadProductImageAsync(IFormFile file, CancellationToken cancellationToken = default);
        Task<UploadProductImageResponse> UploadExchangeImageAsync(IFormFile file, CancellationToken cancellationToken = default);
    }
}
