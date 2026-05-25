using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Models.Realtime;

namespace TerraVision.Api.Services
{
    public class ArSessionService : IArSessionService
    {
        private readonly TerraVisionDbContext _dbContext;
        private readonly IMediaService _mediaService;
        private readonly IRealtimeSyncService _realtimeSyncService;

        public ArSessionService(
            TerraVisionDbContext dbContext,
            IMediaService mediaService,
            IRealtimeSyncService realtimeSyncService)
        {
            _dbContext = dbContext;
            _mediaService = mediaService;
            _realtimeSyncService = realtimeSyncService;
        }

        public async Task<ArSessionResponseDto> SaveSessionAsync(
            int userId,
            SaveArSessionRequestDto request,
            IFormFile? screenshot,
            string? screenshotUrl = null,
            CancellationToken cancellationToken = default)
        {
            var product = await _dbContext.Products
                .AsNoTracking()
                .SingleOrDefaultAsync(p => p.Id == request.ProductId && !p.IsDeleted && p.IsActive, cancellationToken);

            if (product == null || !product.IsArCompatible)
            {
                throw new InvalidOperationException("AR-compatible product not found.");
            }

            var resolvedScreenshotUrl = await ResolveScreenshotUrlAsync(screenshot, screenshotUrl, cancellationToken);
            var metadata = JsonSerializer.Serialize(new
            {
                environmentNotes = request.EnvironmentNotes ?? string.Empty
            });

            var session = new ArSession
            {
                UserId = userId,
                ProductId = request.ProductId,
                DeviceModel = request.DeviceModel.Trim(),
                ScreenshotUrl = resolvedScreenshotUrl,
                ScaleX = request.ScaleX,
                ScaleY = request.ScaleY,
                ScaleZ = request.ScaleZ,
                RotationY = request.RotationY,
                EnvironmentMetadata = metadata,
                CreatedDate = DateTime.UtcNow,
                IsActive = true,
                IsDeleted = false
            };

            _dbContext.ArSessions.Add(session);
            await _dbContext.SaveChangesAsync(cancellationToken);

            var user = await _dbContext.Users
                .AsNoTracking()
                .SingleAsync(u => u.Id == userId, cancellationToken);

            var response = MapToDto(session, product, user.Email, $"{user.FirstName} {user.LastName}".Trim());

            await _realtimeSyncService.BroadcastArSessionCreatedAsync(new ArSessionCreatedEvent
            {
                SessionId = session.Id,
                UserId = userId,
                CustomerEmail = user.Email,
                ProductId = product.Id,
                ProductName = product.Name,
                ScreenshotUrl = session.ScreenshotUrl,
                ScaleX = session.ScaleX,
                ScaleY = session.ScaleY,
                ScaleZ = session.ScaleZ,
                OccurredAtUtc = session.CreatedDate
            });

            return response;
        }

        private async Task<string> ResolveScreenshotUrlAsync(
            IFormFile? screenshot,
            string? screenshotUrl,
            CancellationToken cancellationToken)
        {
            if (!string.IsNullOrWhiteSpace(screenshotUrl))
            {
                return screenshotUrl.Trim();
            }

            if (screenshot != null && screenshot.Length > 0)
            {
                var upload = await _mediaService.UploadArScreenshotAsync(screenshot, cancellationToken);
                return upload.Url;
            }

            throw new ArgumentException("Screenshot or screenshotUrl is required.");
        }

        public async Task<IReadOnlyList<ArSessionResponseDto>> GetMySessionsAsync(int userId)
        {
            var sessions = await QuerySessions()
                .Where(s => s.Session.UserId == userId)
                .OrderByDescending(s => s.Session.CreatedDate)
                .ToListAsync();

            return sessions.Select(s => MapToDto(s.Session, s.Product, null, null)).ToList();
        }

        public async Task<IReadOnlyList<ArSessionResponseDto>> GetAllSessionsAsync()
        {
            var sessions = await QuerySessions()
                .OrderByDescending(s => s.Session.CreatedDate)
                .ToListAsync();

            return sessions
                .Select(s => MapToDto(s.Session, s.Product, s.UserEmail, s.UserName))
                .ToList();
        }

        private IQueryable<ArSessionProjection> QuerySessions()
        {
            return _dbContext.ArSessions
                .AsNoTracking()
                .Where(s => !s.IsDeleted)
                .Join(_dbContext.Products.Where(p => !p.IsDeleted),
                    s => s.ProductId,
                    p => p.Id,
                    (s, p) => new { Session = s, Product = p })
                .Join(_dbContext.Users.Where(u => !u.IsDeleted),
                    x => x.Session.UserId,
                    u => u.Id,
                    (x, u) => new ArSessionProjection
                    {
                        Session = x.Session,
                        Product = x.Product,
                        UserEmail = u.Email,
                        UserName = $"{u.FirstName} {u.LastName}".Trim()
                    });
        }

        private static ArSessionResponseDto MapToDto(
            ArSession session,
            Product product,
            string? customerEmail,
            string? customerName)
        {
            return new ArSessionResponseDto
            {
                Id = session.Id,
                UserId = session.UserId,
                CustomerEmail = customerEmail,
                CustomerName = customerName,
                ProductId = session.ProductId,
                ProductName = product.Name,
                ProductImageUrl = product.ImageUrl,
                DeviceModel = session.DeviceModel,
                ScreenshotUrl = session.ScreenshotUrl,
                ScaleX = session.ScaleX,
                ScaleY = session.ScaleY,
                ScaleZ = session.ScaleZ,
                RotationY = session.RotationY,
                EnvironmentMetadata = session.EnvironmentMetadata,
                CreatedDate = session.CreatedDate
            };
        }

        private sealed class ArSessionProjection
        {
            public ArSession Session { get; init; } = null!;
            public Product Product { get; init; } = null!;
            public string UserEmail { get; init; } = string.Empty;
            public string UserName { get; init; } = string.Empty;
        }
    }
}
