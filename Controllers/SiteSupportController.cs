using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TerraVision.Api.Extensions;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/site-support")]
    public class SiteSupportController : ControllerBase
    {
        private readonly ISiteSupportService _siteSupportService;

        public SiteSupportController(ISiteSupportService siteSupportService)
        {
            _siteSupportService = siteSupportService;
        }

        [HttpGet("footer")]
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.CatalogRead)]
        public async Task<IActionResult> GetFooter()
        {
            var footer = await _siteSupportService.GetFooterAsync();
            return Ok(footer);
        }

        [HttpPost("feedback")]
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.SupportFeedback)]
        public async Task<IActionResult> SubmitFeedback([FromBody] SubmitSiteFeedbackRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            int? userId = null;
            var sub = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrWhiteSpace(sub) && int.TryParse(sub, out var parsed))
            {
                userId = parsed;
            }

            var created = await _siteSupportService.SubmitFeedbackAsync(request, userId);
            return CreatedAtAction(nameof(GetFeedbackForAdmin), new { id = created.Id }, created);
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminOverview([FromQuery] int take = 200)
        {
            var overview = await _siteSupportService.GetAdminOverviewAsync(take);
            return Ok(overview);
        }

        [HttpGet("feedback")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetFeedbackForAdmin([FromQuery] int take = 100)
        {
            var items = await _siteSupportService.GetSubmissionsForAdminAsync(take);
            return Ok(items);
        }

        [HttpPatch("feedback/{id:int}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateFeedbackStatus(int id, [FromBody] UpdateSiteFeedbackStatusRequest request)
        {
            try
            {
                var updated = await _siteSupportService.UpdateSubmissionStatusAsync(id, request.Status);
                return Ok(updated);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Geri bildirim bulunamadı." });
            }
        }
    }
}
