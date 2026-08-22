using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services
{
    public class SiteSupportService : ISiteSupportService
    {
        public const string UserStoryHint =
            "Ziyaretçi olarak, [sorunu kısaca yazın], böylece [beklediğiniz sonuç]. Örnek: Ziyaretçi olarak, ürün görselleri yüklenmiyor, böylece alışverişe devam edebilirim.";

        private readonly TerraVisionDbContext _db;

        public SiteSupportService(TerraVisionDbContext db)
        {
            _db = db;
        }

        public async Task<SiteSupportFooterDto> GetFooterAsync()
        {
            var channels = await _db.SiteContactChannels
                .AsNoTracking()
                .Where(c => c.IsActive && !c.IsDeleted)
                .OrderBy(c => c.SortOrder)
                .Select(c => new SiteContactChannelDto
                {
                    ChannelKey = c.ChannelKey,
                    Label = c.Label,
                    Email = c.Email
                })
                .ToListAsync();

            return new SiteSupportFooterDto
            {
                Channels = channels,
                UserStoryHint = UserStoryHint
            };
        }

        public async Task<SiteFeedbackSubmissionDto> SubmitFeedbackAsync(SubmitSiteFeedbackRequest request, int? userId)
        {
            var submission = new SiteFeedbackSubmission
            {
                Email = request.Email.Trim(),
                UserStory = request.UserStory.Trim(),
                Kind = request.Kind,
                PageUrl = string.IsNullOrWhiteSpace(request.PageUrl) ? null : request.PageUrl.Trim(),
                UserId = userId,
                Status = SiteFeedbackStatus.New,
                CreatedDate = DateTime.UtcNow,
                IsActive = true,
                IsDeleted = false
            };

            await _db.SiteFeedbackSubmissions.AddAsync(submission);
            await _db.SaveChangesAsync();

            return MapSubmission(submission);
        }

        public async Task<IReadOnlyList<SiteFeedbackSubmissionDto>> GetSubmissionsForAdminAsync(int take = 100)
        {
            var overview = await GetAdminOverviewAsync(take);
            return overview.Submissions;
        }

        public async Task<SiteSupportAdminOverviewDto> GetAdminOverviewAsync(int take = 200)
        {
            var clampedTake = Math.Clamp(take, 1, 500);

            var channels = await _db.SiteContactChannels
                .AsNoTracking()
                .Where(c => !c.IsDeleted)
                .OrderBy(c => c.SortOrder)
                .Select(c => new SiteContactChannelAdminDto
                {
                    Id = c.Id,
                    ChannelKey = c.ChannelKey,
                    Label = c.Label,
                    Email = c.Email,
                    SortOrder = c.SortOrder,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            var submissions = await _db.SiteFeedbackSubmissions
                .AsNoTracking()
                .Where(s => !s.IsDeleted)
                .OrderByDescending(s => s.CreatedDate)
                .Take(clampedTake)
                .ToListAsync();

            var totalCount = await _db.SiteFeedbackSubmissions.CountAsync(s => !s.IsDeleted);
            var newCount = await _db.SiteFeedbackSubmissions.CountAsync(
                s => !s.IsDeleted && s.Status == SiteFeedbackStatus.New);

            return new SiteSupportAdminOverviewDto
            {
                Channels = channels,
                Submissions = submissions.Select(MapSubmission).ToList(),
                NewSubmissionCount = newCount,
                TotalSubmissionCount = totalCount
            };
        }

        public async Task<SiteFeedbackSubmissionDto> UpdateSubmissionStatusAsync(int id, SiteFeedbackStatus status)
        {
            var submission = await _db.SiteFeedbackSubmissions
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted)
                ?? throw new KeyNotFoundException("Geri bildirim bulunamadı.");

            submission.Status = status;
            submission.UpdatedDate = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return MapSubmission(submission);
        }

        private static SiteFeedbackSubmissionDto MapSubmission(SiteFeedbackSubmission s) =>
            new()
            {
                Id = s.Id,
                Email = s.Email,
                UserStory = s.UserStory,
                Kind = s.Kind,
                Status = s.Status,
                PageUrl = s.PageUrl,
                UserId = s.UserId,
                CreatedDate = s.CreatedDate
            };
    }
}
