using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Extensions;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.Realtime;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RealtimeController : ControllerBase
    {
        private readonly IRealtimeSyncService _realtimeSyncService;

        public RealtimeController(IRealtimeSyncService realtimeSyncService)
        {
            _realtimeSyncService = realtimeSyncService;
        }

        [HttpPost("cart-changed")]
        public async Task<IActionResult> BroadcastCartChanged([FromBody] CartChangedEvent request)
        {
            if (!User.TryGetUserId(out var userId))
            {
                return Unauthorized("Invalid user identity");
            }

            request.UserId = userId;
            request.OccurredAtUtc = DateTime.UtcNow;

            await _realtimeSyncService.BroadcastCartChangedAsync(request);
            return Accepted(new { Message = "Cart change event broadcasted." });
        }
    }
}
