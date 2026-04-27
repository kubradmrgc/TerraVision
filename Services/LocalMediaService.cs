using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services
{
    public class LocalMediaService : IMediaService
    {
        private static readonly HashSet<string> AllowedExtensions = [".gltf", ".usdz"];
        private const long MaxFileSizeBytes = 50 * 1024 * 1024;

        private readonly IWebHostEnvironment _hostEnvironment;

        public LocalMediaService(IWebHostEnvironment hostEnvironment)
        {
            _hostEnvironment = hostEnvironment;
        }

        public async Task<UploadArModelResponse> UploadArModelAsync(IFormFile file, CancellationToken cancellationToken = default)
        {
            if (file.Length <= 0)
            {
                throw new ArgumentException("File is empty.");
            }

            if (file.Length > MaxFileSizeBytes)
            {
                throw new ArgumentException("File size exceeds allowed limit.");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
            {
                throw new ArgumentException("Only .gltf and .usdz files are allowed.");
            }

            var webRootPath = _hostEnvironment.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(_hostEnvironment.ContentRootPath, "wwwroot");
            }

            var arFolder = Path.Combine(webRootPath, "assets", "ar-models");
            Directory.CreateDirectory(arFolder);

            var generatedFileName = $"{Path.GetFileNameWithoutExtension(file.FileName)}-{Guid.NewGuid():N}{extension}";
            var fullPath = Path.Combine(arFolder, generatedFileName);

            await using var stream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write);
            await file.CopyToAsync(stream, cancellationToken);

            return new UploadArModelResponse
            {
                FileName = generatedFileName,
                Url = $"/assets/ar-models/{generatedFileName}",
                Size = file.Length
            };
        }
    }
}
