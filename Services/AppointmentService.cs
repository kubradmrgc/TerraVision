using System.Data;
using Mapster;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;
using TerraVision.Api.Exceptions;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services
{
    public class AppointmentService : IAppointmentService
    {
        private const int ConversionAttributionWindowDays = 30;

        private readonly IRepository<Appointment> _appointmentRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly TerraVisionDbContext _dbContext;
        private readonly IAppointmentInstrumentation _instrumentation;
        private readonly INotificationService _notificationService;

        public AppointmentService(
            IRepository<Appointment> appointmentRepository,
            IRepository<User> userRepository,
            IUnitOfWork unitOfWork,
            TerraVisionDbContext dbContext,
            IAppointmentInstrumentation instrumentation,
            INotificationService notificationService)
        {
            _appointmentRepository = appointmentRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _dbContext = dbContext;
            _instrumentation = instrumentation;
            _notificationService = notificationService;
        }

        public async Task<AppointmentDto> CreateAppointmentAsync(int customerId, CreateAppointmentRequest request)
        {
            var consultant = await _userRepository.SingleOrDefaultAsync(u => u.Id == request.ConsultantId && u.Role == UserRole.Consultant && !u.IsDeleted);
            if (consultant == null)
            {
                _instrumentation.RecordCreateFailed("invalid_consultant", customerId: customerId, consultantId: request.ConsultantId);
                throw new ArgumentException("Invalid Consultant ID.");
            }

            var slotInstant = NormalizeSlotInstant(request.AppointmentDate);
            if (slotInstant <= DateTime.UtcNow)
            {
                _instrumentation.RecordCreateFailed("slot_in_past", customerId: customerId, consultantId: request.ConsultantId);
                throw new ArgumentException("Appointment time must be in the future.");
            }

            var appointment = new Appointment
            {
                CustomerId = customerId,
                ConsultantId = request.ConsultantId,
                AppointmentDate = slotInstant,
                Notes = request.Notes,
                Status = AppointmentStatus.Pending
            };

            await using var transaction = _dbContext.Database.IsRelational()
                ? await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable)
                : null;

            if (await IsConsultantSlotTakenAsync(request.ConsultantId, slotInstant))
            {
                _instrumentation.RecordCreateFailed("slot_conflict", customerId: customerId, consultantId: request.ConsultantId);
                throw new AppointmentConflictException(
                    "Bu saat dilimi artık müsait değil. Lütfen başka bir zaman seçin veya sayfayı yenileyin.");
            }

            try
            {
                await _appointmentRepository.AddAsync(appointment);
                await _unitOfWork.CommitAsync();
                if (transaction != null)
                {
                    await transaction.CommitAsync();
                }
            }
            catch (DbUpdateException ex) when (IsUniqueSlotViolation(ex))
            {
                _instrumentation.RecordCreateFailed("slot_conflict", ex, customerId, request.ConsultantId);
                throw new AppointmentConflictException(
                    "Bu saat dilimi artık müsait değil. Lütfen başka bir zaman seçin veya sayfayı yenileyin.");
            }

            var dto = appointment.Adapt<AppointmentDto>();
            _instrumentation.RecordCreateSucceeded(dto, customerId);

            var slotText = appointment.AppointmentDate.ToString("dd.MM.yyyy HH:mm");
            await _notificationService.CreateAsync(
                appointment.ConsultantId,
                NotificationType.AppointmentCreated,
                "Yeni randevu talebi",
                $"{slotText} tarihli yeni bir randevu talebiniz var.",
                relatedEntityType: "Appointment",
                relatedEntityId: appointment.Id);

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

            if (request.RowVersion is { Length: > 0 })
            {
                _dbContext.Entry(appointment).Property(a => a.RowVersion).OriginalValue = request.RowVersion;
            }

            var slotInstant = NormalizeSlotInstant(appointment.AppointmentDate);
            if (request.Status != AppointmentStatus.Cancelled &&
                previousStatus == AppointmentStatus.Cancelled &&
                await IsConsultantSlotTakenAsync(appointment.ConsultantId, slotInstant, excludeAppointmentId: appointment.Id))
            {
                _instrumentation.RecordUpdateFailed("slot_conflict", appointmentId: request.Id);
                throw new AppointmentConflictException(
                    "Bu saat dilimi başka bir randevu tarafından dolduruldu. Lütfen sayfayı yenileyin.");
            }

            appointment.Status = request.Status;
            appointment.UpdatedDate = DateTime.UtcNow;

            _appointmentRepository.Update(appointment);

            try
            {
                await _unitOfWork.CommitAsync();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _instrumentation.RecordUpdateFailed("concurrency_conflict", ex, request.Id);
                throw new AppointmentConcurrencyException(
                    "Bu randevu başka bir işlem tarafından güncellendi. Lütfen sayfayı yenileyip tekrar deneyin.");
            }
            catch (DbUpdateException ex) when (IsUniqueSlotViolation(ex))
            {
                _instrumentation.RecordUpdateFailed("slot_conflict", ex, request.Id);
                throw new AppointmentConflictException(
                    "Bu saat dilimi artık müsait değil. Lütfen başka bir zaman seçin veya sayfayı yenileyin.");
            }

            var dto = appointment.Adapt<AppointmentDto>();
            _instrumentation.RecordUpdateSucceeded(dto, userId, userRole, previousStatus, request.Status);

            if (previousStatus != appointment.Status)
            {
                var slotText = appointment.AppointmentDate.ToString("dd.MM.yyyy HH:mm");
                await _notificationService.CreateAsync(
                    appointment.CustomerId,
                    NotificationType.AppointmentStatusChanged,
                    "Randevu durumu güncellendi",
                    $"{slotText} tarihli randevunuzun durumu \"{DescribeAppointmentStatus(appointment.Status)}\" olarak güncellendi.",
                    relatedEntityType: "Appointment",
                    relatedEntityId: appointment.Id);
            }

            return dto;
        }

        private static string DescribeAppointmentStatus(AppointmentStatus status) => status switch
        {
            AppointmentStatus.Pending => "Beklemede",
            AppointmentStatus.Approved => "Onaylandı",
            AppointmentStatus.Completed => "Tamamlandı",
            AppointmentStatus.Cancelled => "İptal edildi",
            _ => status.ToString()
        };

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

        public async Task<AppointmentDto> RecordAppointmentOutcomeAsync(int userId, UserRole userRole, RecordAppointmentOutcomeRequest request)
        {
            var appointment = await _appointmentRepository.SingleOrDefaultAsync(a => a.Id == request.Id && !a.IsDeleted);
            if (appointment == null)
            {
                throw new KeyNotFoundException("Appointment not found");
            }

            var isAdmin = userRole == UserRole.Admin;
            if (!isAdmin && appointment.ConsultantId != userId)
            {
                throw new UnauthorizedAccessException("You are not authorized to record outcomes for this appointment.");
            }

            if (appointment.Status != AppointmentStatus.Completed)
            {
                throw new ArgumentException("Outcome can only be recorded for completed appointments.");
            }

            if (request.Outcome == AppointmentOutcome.None)
            {
                throw new ArgumentException("A valid outcome is required.");
            }

            if (request.SatisfactionScore is < 1 or > 5)
            {
                throw new ArgumentException("Satisfaction score must be between 1 and 5.");
            }

            if (request.Outcome == AppointmentOutcome.ConvertedToSale)
            {
                if (request.LinkedOrderId == null)
                {
                    throw new ArgumentException("Linked order is required when outcome is a sale conversion.");
                }

                var order = await _dbContext.Orders.SingleOrDefaultAsync(o =>
                    o.Id == request.LinkedOrderId &&
                    !o.IsDeleted &&
                    o.UserId == appointment.CustomerId &&
                    o.Status != OrderStatus.Cancelled);
                if (order == null)
                {
                    throw new ArgumentException("Invalid order for this customer.");
                }
            }
            else if (request.LinkedOrderId != null)
            {
                throw new ArgumentException("Linked order is only allowed for sale conversions.");
            }

            appointment.Outcome = request.Outcome;
            appointment.LinkedOrderId = request.Outcome == AppointmentOutcome.ConvertedToSale ? request.LinkedOrderId : null;
            appointment.SatisfactionScore = request.SatisfactionScore;
            appointment.OutcomeNotes = string.IsNullOrWhiteSpace(request.OutcomeNotes) ? null : request.OutcomeNotes.Trim();
            appointment.OutcomeRecordedAt = DateTime.UtcNow;
            appointment.OutcomeRecordedByUserId = userId;
            appointment.UpdatedDate = DateTime.UtcNow;

            _appointmentRepository.Update(appointment);
            await _unitOfWork.CommitAsync();

            var dto = appointment.Adapt<AppointmentDto>();
            _instrumentation.RecordUpdateSucceeded(dto, userId, userRole, AppointmentStatus.Completed, AppointmentStatus.Completed);
            return dto;
        }

        public async Task<ConsultantPerformanceBoardDto> GetConsultantPerformanceBoardAsync()
        {
            var consultants = await _dbContext.Users
                .AsNoTracking()
                .Where(u => u.Role == UserRole.Consultant && !u.IsDeleted && u.IsActive)
                .OrderBy(u => u.LastName)
                .ThenBy(u => u.FirstName)
                .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email })
                .ToListAsync();

            var appointments = await _dbContext.Appointments
                .AsNoTracking()
                .Where(a => !a.IsDeleted)
                .Select(a => new AppointmentMetricRow(
                    a.Id,
                    a.ConsultantId,
                    a.CustomerId,
                    a.Status,
                    a.Outcome,
                    a.LinkedOrderId,
                    a.SatisfactionScore,
                    a.AppointmentDate))
                .ToListAsync();

            var customerIds = appointments.Select(a => a.CustomerId).Distinct().ToList();
            var orders = customerIds.Count == 0
                ? new List<OrderMetricRow>()
                : await _dbContext.Orders
                    .AsNoTracking()
                    .Where(o => !o.IsDeleted && o.Status != OrderStatus.Cancelled && customerIds.Contains(o.UserId))
                    .Select(o => new OrderMetricRow(o.Id, o.UserId, o.CreatedDate))
                    .ToListAsync();

            var conversionFlags = BuildConversionFlags(appointments, orders);
            var consultantKpis = consultants.Select(c =>
            {
                var mine = appointments.Where(a => a.ConsultantId == c.Id).ToList();
                var completed = mine.Count(a => a.Status == AppointmentStatus.Completed);
                var converted = mine.Count(a => conversionFlags.GetValueOrDefault(a.Id));
                var withScore = mine.Where(a => a.SatisfactionScore is >= 1 and <= 5).ToList();

                return new ConsultantKpiDto
                {
                    ConsultantId = c.Id,
                    FullName = $"{c.FirstName} {c.LastName}".Trim(),
                    Email = c.Email,
                    TotalAppointments = mine.Count,
                    CompletedAppointments = completed,
                    CancelledAppointments = mine.Count(a => a.Status == AppointmentStatus.Cancelled),
                    ConvertedAppointments = converted,
                    ConversionRatePercent = completed == 0 ? 0 : Math.Round(converted * 100.0 / completed, 1),
                    AverageSatisfactionScore = withScore.Count == 0
                        ? null
                        : Math.Round(withScore.Average(a => a.SatisfactionScore!.Value), 1),
                    SatisfactionResponseCount = withScore.Count,
                    PendingOutcomeCount = mine.Count(a =>
                        a.Status == AppointmentStatus.Completed &&
                        a.Outcome == AppointmentOutcome.None &&
                        !conversionFlags.GetValueOrDefault(a.Id))
                };
            }).ToList();

            var summary = BuildConversionSummary(appointments, conversionFlags, orders);

            return new ConsultantPerformanceBoardDto
            {
                GeneratedAtUtc = DateTime.UtcNow,
                Conversion = summary,
                Consultants = consultantKpis
            };
        }

        public async Task<ConsultantKpiDto> GetConsultantKpiAsync(int consultantId)
        {
            var board = await GetConsultantPerformanceBoardAsync();
            var kpi = board.Consultants.SingleOrDefault(c => c.ConsultantId == consultantId);
            if (kpi == null)
            {
                var exists = await _userRepository.SingleOrDefaultAsync(u =>
                    u.Id == consultantId && u.Role == UserRole.Consultant && !u.IsDeleted);
                if (exists == null)
                {
                    throw new KeyNotFoundException("Consultant not found");
                }

                return new ConsultantKpiDto
                {
                    ConsultantId = consultantId,
                    FullName = $"{exists.FirstName} {exists.LastName}".Trim(),
                    Email = exists.Email
                };
            }

            return kpi;
        }

        private static AppointmentConversionSummaryDto BuildConversionSummary(
            IReadOnlyList<AppointmentMetricRow> appointments,
            IReadOnlyDictionary<int, bool> conversionFlags,
            IReadOnlyList<OrderMetricRow> orders)
        {
            var completed = appointments.Where(a => a.Status == AppointmentStatus.Completed).ToList();
            var recorded = completed.Count(a =>
                a.Outcome == AppointmentOutcome.ConvertedToSale || a.LinkedOrderId != null);
            var inferred = completed.Count(a =>
                conversionFlags.GetValueOrDefault(a.Id) &&
                a.Outcome != AppointmentOutcome.ConvertedToSale &&
                a.LinkedOrderId == null);
            var totalConverted = completed.Count(a => conversionFlags.GetValueOrDefault(a.Id));
            var scored = completed.Where(a => a.SatisfactionScore is >= 1 and <= 5).ToList();

            return new AppointmentConversionSummaryDto
            {
                TotalAppointments = appointments.Count,
                PendingCount = appointments.Count(a => a.Status == AppointmentStatus.Pending),
                ApprovedCount = appointments.Count(a => a.Status == AppointmentStatus.Approved),
                CompletedCount = completed.Count,
                CancelledCount = appointments.Count(a => a.Status == AppointmentStatus.Cancelled),
                RecordedConversions = recorded,
                InferredConversions = inferred,
                TotalConverted = totalConverted,
                ConversionRatePercent = completed.Count == 0
                    ? 0
                    : Math.Round(totalConverted * 100.0 / completed.Count, 1),
                AverageSatisfactionScore = scored.Count == 0
                    ? null
                    : Math.Round(scored.Average(a => a.SatisfactionScore!.Value), 1)
            };
        }

        private static Dictionary<int, bool> BuildConversionFlags(
            IReadOnlyList<AppointmentMetricRow> appointments,
            IReadOnlyList<OrderMetricRow> orders)
        {
            var flags = new Dictionary<int, bool>();
            foreach (var appointment in appointments)
            {
                if (appointment.Status != AppointmentStatus.Completed)
                {
                    flags[appointment.Id] = false;
                    continue;
                }

                if (appointment.Outcome == AppointmentOutcome.ConvertedToSale || appointment.LinkedOrderId != null)
                {
                    flags[appointment.Id] = true;
                    continue;
                }

                var windowEnd = appointment.AppointmentDate.AddDays(ConversionAttributionWindowDays);
                var hasInferredOrder = orders.Any(o =>
                    o.UserId == appointment.CustomerId &&
                    o.CreatedDate >= appointment.AppointmentDate &&
                    o.CreatedDate <= windowEnd);

                flags[appointment.Id] = hasInferredOrder;
            }

            return flags;
        }

        private sealed record AppointmentMetricRow(
            int Id,
            int ConsultantId,
            int CustomerId,
            AppointmentStatus Status,
            AppointmentOutcome Outcome,
            int? LinkedOrderId,
            int? SatisfactionScore,
            DateTime AppointmentDate);

        private sealed record OrderMetricRow(int Id, int UserId, DateTime CreatedDate);

        private async Task<bool> IsConsultantSlotTakenAsync(int consultantId, DateTime slotInstant, int? excludeAppointmentId = null)
        {
            return await _dbContext.Appointments.AnyAsync(a =>
                !a.IsDeleted &&
                a.ConsultantId == consultantId &&
                a.AppointmentDate == slotInstant &&
                a.Status != AppointmentStatus.Cancelled &&
                (excludeAppointmentId == null || a.Id != excludeAppointmentId));
        }

        private static DateTime NormalizeSlotInstant(DateTime value)
        {
            var utc = value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
            return new DateTime(utc.Year, utc.Month, utc.Day, utc.Hour, utc.Minute, 0, DateTimeKind.Utc);
        }

        private static bool IsUniqueSlotViolation(DbUpdateException exception)
        {
            for (var current = exception.InnerException; current != null; current = current.InnerException)
            {
                if (current is SqlException sql && (sql.Number == 2627 || sql.Number == 2601))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
