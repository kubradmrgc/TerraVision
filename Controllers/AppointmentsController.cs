using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        public async Task<IActionResult> Create([FromBody] CreateAppointmentRequest request)
        {
            var customerId = GetCurrentUserId();
            if (customerId == null)
            {
                return Unauthorized();
            }

            var appointment = await _appointmentService.CreateAppointmentAsync(customerId.Value, request);
            return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, appointment);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var appointment = await _appointmentService.GetAppointmentByIdAsync(id);
            if (appointment == null)
            {
                return NotFound();
            }

            if (!User.IsInRole(UserRole.Admin.ToString()) &&
                appointment.CustomerId != userId.Value &&
                appointment.ConsultantId != userId.Value)
            {
                return Forbid();
            }

            return Ok(appointment);
        }

        [HttpGet("customer")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyCustomerAppointments()
        {
            var customerId = GetCurrentUserId();
            if (customerId == null) return Unauthorized();

            var appointments = await _appointmentService.GetCustomerAppointmentsAsync(customerId.Value);
            return Ok(appointments);
        }

        [HttpGet("consultant")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> GetMyConsultantAppointments()
        {
            var consultantId = GetCurrentUserId();
            if (consultantId == null) return Unauthorized();

            var appointments = await _appointmentService.GetConsultantAppointmentsAsync(consultantId.Value);
            return Ok(appointments);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAppointmentStatusRequest request)
        {
            if (id != request.Id) return BadRequest("ID mismatch");

            var consultantId = GetCurrentUserId();
            if (consultantId == null) return Unauthorized();

            var appointment = await _appointmentService.UpdateAppointmentStatusAsync(consultantId.Value, request);
            return Ok(appointment);
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}
