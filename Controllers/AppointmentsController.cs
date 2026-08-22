using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TerraVision.Api.Extensions;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;

        public AppointmentsController(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        [EnableRateLimiting(RateLimitPolicies.AppointmentsWrite)]
        public async Task<IActionResult> Create([FromBody] CreateAppointmentRequest request)
        {
            var customerId = GetCurrentUserId();
            var appointment = await _appointmentService.CreateAppointmentAsync(customerId, request);
            return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, appointment);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();
            var appointment = await _appointmentService.GetAppointmentByIdForUserAsync(userId, userRole, id);
            return Ok(appointment);
        }

        [HttpGet("customer")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyCustomerAppointments()
        {
            var customerId = GetCurrentUserId();
            var appointments = await _appointmentService.GetCustomerAppointmentsAsync(customerId);
            return Ok(appointments);
        }

        [HttpGet("consultant")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> GetMyConsultantAppointments()
        {
            var consultantId = GetCurrentUserId();
            var appointments = await _appointmentService.GetConsultantAppointmentsAsync(consultantId);
            return Ok(appointments);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAppointmentStatusRequest request)
        {
            if (id != request.Id) return BadRequest("ID mismatch");

            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();
            var appointment = await _appointmentService.UpdateAppointmentStatusAsync(userId, userRole, request);
            return Ok(appointment);
        }

        [HttpPut("{id}/outcome")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> RecordOutcome(int id, [FromBody] RecordAppointmentOutcomeRequest request)
        {
            if (id != request.Id) return BadRequest("ID mismatch");

            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();
            var appointment = await _appointmentService.RecordAppointmentOutcomeAsync(userId, userRole, request);
            return Ok(appointment);
        }

        [HttpGet("analytics/performance")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPerformanceBoard()
        {
            var board = await _appointmentService.GetConsultantPerformanceBoardAsync();
            return Ok(board);
        }

        [HttpGet("analytics/my-performance")]
        [Authorize(Roles = "Consultant")]
        public async Task<IActionResult> GetMyPerformance()
        {
            var consultantId = GetCurrentUserId();
            var kpi = await _appointmentService.GetConsultantKpiAsync(consultantId);
            return Ok(kpi);
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user identity.");
            }

            return userId;
        }

        private UserRole GetCurrentUserRole()
        {
            // JWT bearer with MapInboundClaims=false exposes short claim type "role", not ClaimTypes.Role.
            var roleClaim = User.FindFirst("role")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value;
            if (!Enum.TryParse<UserRole>(roleClaim, ignoreCase: true, out var userRole))
            {
                throw new UnauthorizedAccessException("Invalid user role.");
            }

            return userRole;
        }
    }
}
