using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services
{
    public class CareService : ICareService
    {
        private readonly TerraVisionDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;

        public CareService(TerraVisionDbContext dbContext, IUnitOfWork unitOfWork)
        {
            _dbContext = dbContext;
            _unitOfWork = unitOfWork;
        }

        public async Task ProvisionCalendarsForDeliveredOrderAsync(int orderId)
        {
            var order = await _dbContext.Orders
                .AsNoTracking()
                .SingleOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted);
            if (order == null)
            {
                return;
            }

            var orderProducts = await _dbContext.OrderItems
                .Where(oi => oi.OrderId == orderId && !oi.IsDeleted)
                .Join(
                    _dbContext.Products.Where(p => !p.IsDeleted && p.IsActive),
                    oi => oi.ProductId,
                    p => p.Id,
                    (oi, p) => p)
                .Distinct()
                .ToListAsync();

            var plantLines = orderProducts
                .Where(PlantCareRules.QualifiesForCareCalendar)
                .Select(p => p.Id)
                .Distinct()
                .ToList();

            if (plantLines.Count == 0)
            {
                return;
            }

            var anchor = DateTime.UtcNow;
            var existing = await _dbContext.PlantCareCalendars
                .Where(c => c.UserId == order.UserId && plantLines.Contains(c.ProductId) && !c.IsDeleted)
                .ToDictionaryAsync(c => c.ProductId);

            foreach (var productId in plantLines)
            {
                var product = await _dbContext.Products
                    .AsNoTracking()
                    .SingleAsync(p => p.Id == productId);

                if (existing.TryGetValue(productId, out var calendar))
                {
                    ApplyInitialSchedule(calendar, product, anchor);
                    calendar.UpdatedDate = anchor;
                    _dbContext.PlantCareCalendars.Update(calendar);
                    continue;
                }

                calendar = new PlantCareCalendar
                {
                    UserId = order.UserId,
                    ProductId = productId,
                    CreatedDate = anchor
                };
                ApplyInitialSchedule(calendar, product, anchor);
                await _dbContext.PlantCareCalendars.AddAsync(calendar);
            }
        }

        public async Task<PlantCareCalendarDto> AddPlantToGardenAsync(int userId, int productId)
        {
            var product = await _dbContext.Products
                .SingleOrDefaultAsync(p => p.Id == productId && !p.IsDeleted && p.IsActive);
            if (product == null)
            {
                throw new KeyNotFoundException("Ürün bulunamadı.");
            }

            if (!PlantCareRules.QualifiesForCareCalendar(product))
            {
                throw new ArgumentException("Bu ürün bakım takvimine eklenemez.");
            }

            var anchor = DateTime.UtcNow;
            var calendar = await _dbContext.PlantCareCalendars
                .SingleOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId && !c.IsDeleted);

            if (calendar == null)
            {
                calendar = new PlantCareCalendar
                {
                    UserId = userId,
                    ProductId = productId,
                    CreatedDate = anchor,
                    IsActive = true
                };
                ApplyInitialSchedule(calendar, product, anchor);
                await _dbContext.PlantCareCalendars.AddAsync(calendar);
            }
            else
            {
                calendar.IsActive = true;
                ApplyInitialSchedule(calendar, product, anchor);
                calendar.UpdatedDate = anchor;
                _dbContext.PlantCareCalendars.Update(calendar);
            }

            await _unitOfWork.CommitAsync();
            return MapToDto(calendar, product);
        }

        public async Task<IReadOnlyList<CareCatalogPlantDto>> GetCatalogPlantsAsync(int userId)
        {
            var gardenProductIds = await _dbContext.PlantCareCalendars
                .AsNoTracking()
                .Where(c => c.UserId == userId && !c.IsDeleted && c.IsActive)
                .Select(c => c.ProductId)
                .ToListAsync();

            var products = await _dbContext.Products
                .AsNoTracking()
                .Where(p => !p.IsDeleted && p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();

            return products
                .Where(PlantCareRules.QualifiesForCareCalendar)
                .Select(p => new CareCatalogPlantDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    CareInstructions = p.CareInstructions,
                    WateringIntervalDays = p.WateringIntervalDays,
                    FertilizingIntervalDays = p.FertilizingIntervalDays,
                    CleaningIntervalDays = p.CleaningIntervalDays,
                    IsInMyGarden = gardenProductIds.Contains(p.Id)
                })
                .ToList();
        }

        public async Task<MyPlantCareCalendarResponse> GetMyCalendarAsync(int userId)
        {
            var rows = await _dbContext.PlantCareCalendars
                .AsNoTracking()
                .Where(c => c.UserId == userId && !c.IsDeleted && c.IsActive)
                .Join(
                    _dbContext.Products.Where(p => !p.IsDeleted),
                    c => c.ProductId,
                    p => p.Id,
                    (c, p) => new { Calendar = c, Product = p })
                .OrderBy(x => x.Product.Name)
                .ToListAsync();

            var plants = rows
                .Select(x => MapToDto(x.Calendar, x.Product))
                .OrderByDescending(p => (int)p.OverallUrgency)
                .ThenBy(p => p.ProductName)
                .ToList();

            return new MyPlantCareCalendarResponse { Plants = plants };
        }

        public async Task<PlantCareCalendarDto> CompleteActionAsync(int userId, int calendarId, CompleteCareActionRequest request)
        {
            var row = await _dbContext.PlantCareCalendars
                .Where(c => c.Id == calendarId && !c.IsDeleted && c.IsActive)
                .Join(
                    _dbContext.Products.Where(p => !p.IsDeleted),
                    c => c.ProductId,
                    p => p.Id,
                    (c, p) => new { Calendar = c, Product = p })
                .SingleOrDefaultAsync();

            if (row == null)
            {
                throw new KeyNotFoundException("Bakım takvimi kaydı bulunamadı.");
            }

            if (row.Calendar.UserId != userId)
            {
                throw new UnauthorizedAccessException("Bu bakım kaydına erişim yetkiniz yok.");
            }

            var interval = GetIntervalDays(row.Product, request.ActionType);
            if (interval is null or < 1)
            {
                throw new ArgumentException("Bu bitki için seçilen bakım aksiyonu tanımlı değil.");
            }

            var completedAt = DateTime.UtcNow;
            ApplyCompletion(row.Calendar, request.ActionType, completedAt, interval.Value);

            await _dbContext.CareLogs.AddAsync(new CareLog
            {
                PlantCareCalendarId = row.Calendar.Id,
                ActionType = request.ActionType,
                CompletedAt = completedAt,
                Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
                CreatedDate = completedAt
            });

            row.Calendar.UpdatedDate = completedAt;
            _dbContext.PlantCareCalendars.Update(row.Calendar);
            await _unitOfWork.CommitAsync();

            return MapToDto(row.Calendar, row.Product);
        }

        private static void ApplyInitialSchedule(PlantCareCalendar calendar, Product product, DateTime anchor)
        {
            if (product.WateringIntervalDays is > 0)
            {
                calendar.NextWateringDueAt = anchor.AddDays(product.WateringIntervalDays.Value);
            }

            if (product.FertilizingIntervalDays is > 0)
            {
                calendar.NextFertilizingDueAt = anchor.AddDays(product.FertilizingIntervalDays.Value);
            }

            if (product.CleaningIntervalDays is > 0)
            {
                calendar.NextCleaningDueAt = anchor.AddDays(product.CleaningIntervalDays.Value);
            }
        }

        private static void ApplyCompletion(PlantCareCalendar calendar, CareActionType action, DateTime completedAt, int intervalDays)
        {
            switch (action)
            {
                case CareActionType.Watering:
                    calendar.LastWateredAt = completedAt;
                    calendar.NextWateringDueAt = completedAt.AddDays(intervalDays);
                    break;
                case CareActionType.Fertilizing:
                    calendar.LastFertilizedAt = completedAt;
                    calendar.NextFertilizingDueAt = completedAt.AddDays(intervalDays);
                    break;
                case CareActionType.Cleaning:
                    calendar.LastCleanedAt = completedAt;
                    calendar.NextCleaningDueAt = completedAt.AddDays(intervalDays);
                    break;
                default:
                    throw new ArgumentException("Geçersiz bakım aksiyonu.");
            }
        }

        private static int? GetIntervalDays(Product product, CareActionType action) => action switch
        {
            CareActionType.Watering => product.WateringIntervalDays,
            CareActionType.Fertilizing => product.FertilizingIntervalDays,
            CareActionType.Cleaning => product.CleaningIntervalDays,
            _ => null
        };

        private static DateTime? GetLastCompleted(PlantCareCalendar calendar, CareActionType action) => action switch
        {
            CareActionType.Watering => calendar.LastWateredAt,
            CareActionType.Fertilizing => calendar.LastFertilizedAt,
            CareActionType.Cleaning => calendar.LastCleanedAt,
            _ => null
        };

        private static DateTime? GetNextDue(PlantCareCalendar calendar, CareActionType action) => action switch
        {
            CareActionType.Watering => calendar.NextWateringDueAt,
            CareActionType.Fertilizing => calendar.NextFertilizingDueAt,
            CareActionType.Cleaning => calendar.NextCleaningDueAt,
            _ => null
        };

        private static PlantCareCalendarDto MapToDto(PlantCareCalendar calendar, Product product)
        {
            var tasks = new List<CareTaskDto>();
            foreach (CareActionType action in Enum.GetValues<CareActionType>())
            {
                var interval = GetIntervalDays(product, action);
                if (interval is null or < 1)
                {
                    continue;
                }

                var nextDue = GetNextDue(calendar, action);
                tasks.Add(new CareTaskDto
                {
                    ActionType = action,
                    IntervalDays = interval,
                    NextDueAt = nextDue,
                    LastCompletedAt = GetLastCompleted(calendar, action),
                    Urgency = EvaluateUrgency(nextDue),
                    IsActionEnabled = true
                });
            }

            var overall = tasks.Count == 0
                ? CareTaskUrgency.None
                : tasks.Max(t => t.Urgency);

            return new PlantCareCalendarDto
            {
                Id = calendar.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                ProductImageUrl = product.ImageUrl,
                CareInstructions = product.CareInstructions,
                OverallUrgency = overall,
                Tasks = tasks
            };
        }

        internal static CareTaskUrgency EvaluateUrgency(DateTime? nextDueAt)
        {
            if (nextDueAt == null)
            {
                return CareTaskUrgency.None;
            }

            var dueDate = nextDueAt.Value.Date;
            var today = DateTime.UtcNow.Date;
            if (dueDate < today)
            {
                return CareTaskUrgency.Overdue;
            }

            if (dueDate == today)
            {
                return CareTaskUrgency.DueToday;
            }

            if (dueDate <= today.AddDays(PlantCareRules.UpcomingWindowDays))
            {
                return CareTaskUrgency.Upcoming;
            }

            return CareTaskUrgency.None;
        }
    }
}
