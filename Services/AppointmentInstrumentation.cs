using System.Diagnostics;
using System.Diagnostics.Metrics;
using Microsoft.AspNetCore.Http;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Middlewares;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services
{
    public sealed class AppointmentInstrumentation : IAppointmentInstrumentation
    {
        private static readonly Meter Meter = new("TerraVision.Api.Appointments", "1.0.0");

        private static readonly Counter<long> CreateCompleted = Meter.CreateCounter<long>(
            "terravision.appointments.create.completed",
            unit: "{appointment}",
            description: "Appointment creates that completed successfully.");

        private static readonly Counter<long> CreateFailed = Meter.CreateCounter<long>(
            "terravision.appointments.create.failed",
            unit: "{error}",
            description: "Appointment create failures tagged by error.code.");

        private static readonly Counter<long> UpdateCompleted = Meter.CreateCounter<long>(
            "terravision.appointments.update.completed",
            unit: "{appointment}",
            description: "Appointment status updates that completed successfully.");

        private static readonly Counter<long> UpdateFailed = Meter.CreateCounter<long>(
            "terravision.appointments.update.failed",
            unit: "{error}",
            description: "Appointment status update failures tagged by error.code.");

        private readonly ILogger<AppointmentInstrumentation> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AppointmentInstrumentation(ILogger<AppointmentInstrumentation> logger, IHttpContextAccessor httpContextAccessor)
        {
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public void RecordCreateSucceeded(AppointmentDto dto, int customerId)
        {
            var correlationId = GetCorrelationId();
            CreateCompleted.Add(1);

            _logger.LogInformation(
                "Appointment mutation succeeded {EventKind} {AppointmentId} {CustomerId} {ConsultantId} {Status} {AppointmentDateUtc} {CorrelationId}",
                "appointment.create",
                dto.Id,
                customerId,
                dto.ConsultantId,
                dto.Status,
                dto.AppointmentDate,
                correlationId);
        }

        public void RecordCreateFailed(string errorCode, Exception? exception = null, int? customerId = null, int? consultantId = null)
        {
            var correlationId = GetCorrelationId();
            CreateFailed.Add(1, new KeyValuePair<string, object?>("error.code", errorCode));

            _logger.LogWarning(
                exception,
                "Appointment mutation failed {EventKind} {ErrorCode} {CustomerId} {ConsultantId} {CorrelationId}",
                "appointment.create",
                errorCode,
                customerId,
                consultantId,
                correlationId);
        }

        public void RecordUpdateSucceeded(
            AppointmentDto dto,
            int actorUserId,
            UserRole actorRole,
            AppointmentStatus previousStatus,
            AppointmentStatus newStatus)
        {
            var correlationId = GetCorrelationId();
            UpdateCompleted.Add(1);

            _logger.LogInformation(
                "Appointment mutation succeeded {EventKind} {AppointmentId} {ActorUserId} {ActorRole} {PreviousStatus} {NewStatus} {CorrelationId}",
                "appointment.update_status",
                dto.Id,
                actorUserId,
                actorRole.ToString(),
                previousStatus,
                newStatus,
                correlationId);
        }

        public void RecordUpdateFailed(string errorCode, Exception? exception = null, int? appointmentId = null)
        {
            var correlationId = GetCorrelationId();
            UpdateFailed.Add(1, new KeyValuePair<string, object?>("error.code", errorCode));

            _logger.LogWarning(
                exception,
                "Appointment mutation failed {EventKind} {ErrorCode} {AppointmentId} {CorrelationId}",
                "appointment.update_status",
                errorCode,
                appointmentId,
                correlationId);
        }

        private string GetCorrelationId()
        {
            var fromContext = _httpContextAccessor.HttpContext?.Items[CorrelationIdMiddleware.ItemKey]?.ToString();
            if (!string.IsNullOrWhiteSpace(fromContext))
            {
                return fromContext;
            }

            var traceId = Activity.Current?.TraceId.ToString();
            return string.IsNullOrWhiteSpace(traceId) ? "unknown" : traceId;
        }
    }
}
