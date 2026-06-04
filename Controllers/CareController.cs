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
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class CareController : ControllerBase
    {
        private readonly ICareService _careService;
        private readonly ICareAssistantService _careAssistantService;

        public CareController(ICareService careService, ICareAssistantService careAssistantService)
        {
            _careService = careService;
            _careAssistantService = careAssistantService;
        }

        [HttpGet("my-calendar")]
        public async Task<IActionResult> GetMyCalendar()
        {
            var response = await _careService.GetMyCalendarAsync(GetCurrentUserId());
            return Ok(response);
        }

        [HttpGet("catalog-plants")]
        public async Task<IActionResult> GetCatalogPlants()
        {
            var plants = await _careService.GetCatalogPlantsAsync(GetCurrentUserId());
            return Ok(plants);
        }

        [HttpPost("my-garden")]
        public async Task<IActionResult> AddPlantToGarden([FromBody] AddPlantToGardenRequest request)
        {
            var plant = await _careService.AddPlantToGardenAsync(GetCurrentUserId(), request.ProductId);
            return Ok(plant);
        }

        [HttpPost("{id}/complete-action")]
        public async Task<IActionResult> CompleteAction(int id, [FromBody] CompleteCareActionRequest request)
        {
            var plant = await _careService.CompleteActionAsync(GetCurrentUserId(), id, request);
            return Ok(plant);
        }

        [HttpPost("assistant/chat")]
        [EnableRateLimiting(RateLimitPolicies.CareAssistantChat)]
        public async Task<IActionResult> AssistantChat([FromBody] CareAssistantChatRequest request, CancellationToken cancellationToken)
        {
            var response = await _careAssistantService.ChatAsync(GetCurrentUserId(), request, cancellationToken);
            return Ok(response);
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
