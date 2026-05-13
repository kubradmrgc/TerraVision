using Mapster;
using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services
{
    public class AppointmentService : IAppointmentService
    {
        private readonly IRepository<Appointment> _appointmentRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAppointmentInstrumentation _instrumentation;

        public AppointmentService(
            IRepository<Appointment> appointmentRepository,
            IRepository<User> userRepository,
            IUnitOfWork unitOfWork,
            IAppointmentInstrumentation instrumentation)
        {
            _appointmentRepository = appointmentRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _instrumentation = instrumentation;
        }

        public async Task<AppointmentDto> CreateAppointmentAsync(int customerId, CreateAppointmentRequest request)
        {
            var consultant = await _userRepository.SingleOrDefaultAsync(u => u.Id == request.ConsultantId && u.Role == UserRole.Consultant && !u.IsDeleted);
            if (consultant == null)
            {
                _instrumentation.RecordCreateFailed("invalid_consultant", customerId: customerId, consultantId: request.ConsultantId);
                throw new ArgumentException("Invalid Consultant ID.");
            }

            var appointment = new Appointment
            {
                CustomerId = customerId,
                ConsultantId = request.ConsultantId,
                AppointmentDate = request.AppointmentDate,
                Notes = request.Notes,
                Status = AppointmentStatus.Pending
            };

            await _appointmentRepository.AddAsync(appointment);
            await _unitOfWork.CommitAsync();

            var dto = appointment.Adapt<AppointmentDto>();
            _instrumentation.RecordCreateSucceeded(dto, customerId);
            return dto;
        }

        public async Task<AppointmentDto> UpdateAppointmentStatusAsync(int userId, UserRole userRole, UpdateAppointmentStatusRequest request)
        {
            var appointment = await _appointmentRepository.SingleOrDefaultAsync(a => a.Id == request.Id && !a.IsDeleted);
            if (appointment == null)
            {
                _instrumentation.RecordUpdateFailed("not_found", appointmentId: request.Id);
                throw new KeyNotFoundException("Appointment not found");
            }

            var previousStatus = appointment.Status;
            var isAdmin = userRole == UserRole.Admin;
            if (!isAdmin && appointment.ConsultantId != userId)
            {
                _instrumentation.RecordUpdateFailed("forbidden", appointmentId: request.Id);
                throw new UnauthorizedAccessException("You are not authorized to update this appointment.");
            }

            appointment.Status = request.Status;
            appointment.UpdatedDate = DateTime.UtcNow;

            _appointmentRepository.Update(appointment);
            await _unitOfWork.CommitAsync();

            var dto = appointment.Adapt<AppointmentDto>();
            _instrumentation.RecordUpdateSucceeded(dto, userId, userRole, previousStatus, request.Status);
            return dto;
        }

        public async Task<IEnumerable<AppointmentDto>> GetCustomerAppointmentsAsync(int customerId)
        {
            var appointments = await _appointmentRepository.Find(a => a.CustomerId == customerId && !a.IsDeleted).ToListAsync();
            return appointments.Adapt<IEnumerable<AppointmentDto>>();
        }

        public async Task<IEnumerable<AppointmentDto>> GetConsultantAppointmentsAsync(int consultantId)
        {
            var appointments = await _appointmentRepository.Find(a => a.ConsultantId == consultantId && !a.IsDeleted).ToListAsync();
            return appointments.Adapt<IEnumerable<AppointmentDto>>();
        }

        public async Task<AppointmentDto?> GetAppointmentByIdForUserAsync(int userId, UserRole userRole, int id)
        {
            var appointment = await _appointmentRepository.SingleOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
            if (appointment == null) throw new KeyNotFoundException("Appointment not found");

            var hasAccess = userRole == UserRole.Admin ||
                            (userRole == UserRole.Customer && appointment.CustomerId == userId) ||
                            (userRole == UserRole.Consultant && appointment.ConsultantId == userId);

            if (!hasAccess)
            {
                throw new UnauthorizedAccessException("You are not authorized to view this appointment.");
            }

            return appointment.Adapt<AppointmentDto>();
        }
    }
}
