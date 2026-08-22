using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface IAppointmentService
    {
        Task<AppointmentDto> CreateAppointmentAsync(int customerId, CreateAppointmentRequest request);
        Task<AppointmentDto> UpdateAppointmentStatusAsync(int userId, UserRole userRole, UpdateAppointmentStatusRequest request);
        Task<IEnumerable<AppointmentDto>> GetCustomerAppointmentsAsync(int customerId);
        Task<IEnumerable<AppointmentDto>> GetConsultantAppointmentsAsync(int consultantId);
        Task<AppointmentDto?> GetAppointmentByIdForUserAsync(int userId, UserRole userRole, int id);
        Task<AppointmentDto> RecordAppointmentOutcomeAsync(int userId, UserRole userRole, RecordAppointmentOutcomeRequest request);
        Task<ConsultantPerformanceBoardDto> GetConsultantPerformanceBoardAsync();
        Task<ConsultantKpiDto> GetConsultantKpiAsync(int consultantId);
    }
}
