using Microsoft.AspNetCore.Http;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface IMediaService
    {
        Task<UploadArModelResponse> UploadArModelAsync(IFormFile file, CancellationToken cancellationToken = default);
    }
}
