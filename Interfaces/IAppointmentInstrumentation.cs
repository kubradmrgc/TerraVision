using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    /// <summary>
    /// Structured logging and metrics for appointment mutations (create / status update).
    /// </summary>
    public interface IAppointmentInstrumentation
    {
        void RecordCreateSucceeded(AppointmentDto dto, int customerId);

        void RecordCreateFailed(string errorCode, Exception? exception = null, int? customerId = null, int? consultantId = null);

        void RecordUpdateSucceeded(
            AppointmentDto dto,
            int actorUserId,
            UserRole actorRole,
            AppointmentStatus previousStatus,
            AppointmentStatus newStatus);

        void RecordUpdateFailed(string errorCode, Exception? exception = null, int? appointmentId = null);
    }
}
