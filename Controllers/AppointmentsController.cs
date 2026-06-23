using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Extensions;
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
            if (!User.TryGetUserId(out var customerId))
            {
                return Unauthorized();
            }

            var appointment = await _appointmentService.CreateAppointmentAsync(customerId, request);
            return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, appointment);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var appointment = await _appointmentService.GetAppointmentByIdAsync(id);
            return Ok(appointment);
        }

        [HttpGet("customer")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyCustomerAppointments()
        {
            if (!User.TryGetUserId(out var customerId))
            {
                return Unauthorized();
            }

            var appointments = await _appointmentService.GetCustomerAppointmentsAsync(customerId);
            return Ok(appointments);
        }

        [HttpGet("consultant")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> GetMyConsultantAppointments()
        {
            if (!User.TryGetUserId(out var consultantId))
            {
                return Unauthorized();
            }

            var appointments = await _appointmentService.GetConsultantAppointmentsAsync(consultantId);
            return Ok(appointments);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Consultant,Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAppointmentStatusRequest request)
        {
            if (id != request.Id) return BadRequest("ID mismatch");

            if (!User.TryGetUserId(out var consultantId))
            {
                return Unauthorized();
            }

            var appointment = await _appointmentService.UpdateAppointmentStatusAsync(consultantId, request);
            return Ok(appointment);
        }
    }
}
