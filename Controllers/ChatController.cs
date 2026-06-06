using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet("consultants")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetConsultants()
        {
            var consultants = await _chatService.GetConsultantsAsync();
            return Ok(consultants);
        }

        [HttpGet("sessions")]
        public async Task<IActionResult> GetMySessions()
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();
            var sessions = await _chatService.GetMySessionsAsync(userId, role);
            return Ok(sessions);
        }

        [HttpPost("sessions")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreateSession([FromBody] CreateConsultationSessionRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var customerId = GetCurrentUserId();
                var session = await _chatService.CreateSessionAsync(customerId, request);
                return CreatedAtAction(nameof(GetSession), new { sessionId = session.Id }, session);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("sessions/{sessionId:int}")]
        public async Task<IActionResult> GetSession(int sessionId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var role = GetCurrentUserRole();
                var session = await _chatService.GetSessionAsync(sessionId, userId, role);
                return Ok(session);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Sohbet oturumu bulunamadı." });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpGet("sessions/{sessionId:int}/messages")]
        public async Task<IActionResult> GetMessages(int sessionId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var role = GetCurrentUserRole();
                var messages = await _chatService.GetMessagesAsync(sessionId, userId, role);
                return Ok(messages);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Sohbet oturumu bulunamadı." });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost("sessions/{sessionId:int}/messages")]
        public async Task<IActionResult> SendMessage(int sessionId, [FromBody] SendChatMessageRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var senderId = GetCurrentUserId();
                var message = await _chatService.SendMessageAsync(sessionId, senderId, request.Content);
                return Ok(message);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Sohbet oturumu bulunamadı." });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("sessions/{sessionId:int}/proposals")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> SendProposal(int sessionId, [FromBody] SendProposalRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var consultantId = GetCurrentUserId();
                var message = await _chatService.SendProposalAsync(sessionId, consultantId, request);
                return Ok(message);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Sohbet oturumu bulunamadı." });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            var sub = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(sub) || !int.TryParse(sub, out var userId))
            {
                throw new UnauthorizedAccessException();
            }

            return userId;
        }

        private UserRole GetCurrentUserRole()
        {
            var role = User.FindFirst("role")?.Value;
            return role switch
            {
                "Consultant" => UserRole.Consultant,
                "Admin" => UserRole.Admin,
                _ => UserRole.Customer
            };
        }
    }
}
