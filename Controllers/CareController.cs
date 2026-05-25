using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class CareController : ControllerBase
    {
        private readonly ICareService _careService;

        public CareController(ICareService careService)
        {
            _careService = careService;
        }

        [HttpGet("my-calendar")]
        public async Task<IActionResult> GetMyCalendar()
        {
            var response = await _careService.GetMyCalendarAsync(GetCurrentUserId());
            return Ok(response);
        }

        [HttpPost("{id}/complete-action")]
        public async Task<IActionResult> CompleteAction(int id, [FromBody] CompleteCareActionRequest request)
        {
            var plant = await _careService.CompleteActionAsync(GetCurrentUserId(), id, request);
            return Ok(plant);
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Geçersiz oturum bilgisi.");
            }

            return userId;
        }
    }
}
