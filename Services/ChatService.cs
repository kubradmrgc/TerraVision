using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Models.Realtime;

namespace TerraVision.Api.Services
{
    public class ChatService : IChatService
    {
        private readonly TerraVisionDbContext _db;
        private readonly IRealtimeSyncService _realtimeSyncService;

        public ChatService(TerraVisionDbContext db, IRealtimeSyncService realtimeSyncService)
        {
            _db = db;
            _realtimeSyncService = realtimeSyncService;
        }

        public async Task<IReadOnlyList<ChatConsultantDto>> GetConsultantsAsync()
        {
            var consultants = await _db.Users
                .AsNoTracking()
                .Where(u => u.Role == UserRole.Consultant && !u.IsDeleted && u.IsActive)
                .OrderBy(u => u.Id)
                .Select(u => new ChatConsultantDto
                {
                    Id = u.Id,
                    DisplayName = (u.FirstName + " " + u.LastName).Trim(),
                    Email = u.Email
                })
                .ToListAsync();

            return consultants;
        }

        public async Task<ConsultationSessionDto> CreateSessionAsync(int customerId, CreateConsultationSessionRequest request)
        {
            var consultantExists = await _db.Users
                .AsNoTracking()
                .AnyAsync(u => u.Id == request.ConsultantId && u.Role == UserRole.Consultant && !u.IsDeleted && u.IsActive);

            if (!consultantExists)
            {
                throw new InvalidOperationException("Danışman bulunamadı.");
            }

            if (request.AppointmentId.HasValue)
            {
                var appointmentValid = await _db.Appointments
                    .AsNoTracking()
                    .AnyAsync(a =>
                        a.Id == request.AppointmentId.Value
                        && a.CustomerId == customerId
                        && a.ConsultantId == request.ConsultantId
                        && !a.IsDeleted);

                if (!appointmentValid)
                {
                    throw new InvalidOperationException("Randevu bu danışman için geçerli değil.");
                }
            }

            var existing = await LoadSessionQuery()
                .FirstOrDefaultAsync(s =>
                    s.CustomerId == customerId
                    && s.ConsultantId == request.ConsultantId
                    && s.Status == ConsultationSessionStatus.Open
                    && !s.IsDeleted);

            if (existing is not null)
            {
                var lastMessageAt = await _db.ChatMessages
                    .AsNoTracking()
                    .Where(m => m.SessionId == existing.Id && !m.IsDeleted)
                    .OrderByDescending(m => m.CreatedDate)
                    .Select(m => (DateTime?)m.CreatedDate)
                    .FirstOrDefaultAsync();

                return MapSession(existing, lastMessageAt);
            }

            var session = new ConsultationSession
            {
                CustomerId = customerId,
                ConsultantId = request.ConsultantId,
                Title = request.Title.Trim(),
                AppointmentId = request.AppointmentId,
                Status = ConsultationSessionStatus.Open,
                CreatedDate = DateTime.UtcNow,
                IsActive = true,
                IsDeleted = false
            };

            await _db.ConsultationSessions.AddAsync(session);
            await _db.SaveChangesAsync();

            return await GetSessionAsync(session.Id, customerId, UserRole.Customer);
        }

        public async Task<IReadOnlyList<ConsultationSessionDto>> GetMySessionsAsync(int userId, UserRole role)
        {
            var query = _db.ConsultationSessions
                .AsNoTracking()
                .Where(s => !s.IsDeleted);

            query = role switch
            {
                UserRole.Customer => query.Where(s => s.CustomerId == userId),
                UserRole.Consultant => query.Where(s => s.ConsultantId == userId),
                UserRole.Admin => query,
                _ => query.Where(s => s.CustomerId == userId || s.ConsultantId == userId)
            };

            var sessions = await query
                .OrderByDescending(s => s.UpdatedDate ?? s.CreatedDate)
                .Select(s => new
                {
                    Session = s,
                    CustomerName = s.Customer.FirstName + " " + s.Customer.LastName,
                    ConsultantName = s.Consultant.FirstName + " " + s.Consultant.LastName,
                    LastMessageAt = s.Messages
                        .Where(m => !m.IsDeleted)
                        .OrderByDescending(m => m.CreatedDate)
                        .Select(m => (DateTime?)m.CreatedDate)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return sessions.Select(x => new ConsultationSessionDto
            {
                Id = x.Session.Id,
                CustomerId = x.Session.CustomerId,
                CustomerName = x.CustomerName.Trim(),
                ConsultantId = x.Session.ConsultantId,
                ConsultantName = x.ConsultantName.Trim(),
                Title = x.Session.Title,
                Status = x.Session.Status,
                AppointmentId = x.Session.AppointmentId,
                CreatedDate = x.Session.CreatedDate,
                LastMessageAt = x.LastMessageAt
            }).ToList();
        }

        public async Task<ConsultationSessionDto> GetSessionAsync(int sessionId, int userId, UserRole role)
        {
            var session = await LoadSessionQuery()
                .FirstOrDefaultAsync(s => s.Id == sessionId && !s.IsDeleted);

            if (session is null)
            {
                throw new KeyNotFoundException("Sohbet oturumu bulunamadı.");
            }

            EnsureCanAccess(session, userId, role);

            var lastMessageAt = await _db.ChatMessages
                .AsNoTracking()
                .Where(m => m.SessionId == sessionId && !m.IsDeleted)
                .OrderByDescending(m => m.CreatedDate)
                .Select(m => (DateTime?)m.CreatedDate)
                .FirstOrDefaultAsync();

            return MapSession(session, lastMessageAt);
        }

        public async Task<IReadOnlyList<ChatMessageDto>> GetMessagesAsync(int sessionId, int userId, UserRole role)
        {
            var session = await _db.ConsultationSessions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == sessionId && !s.IsDeleted);

            if (session is null)
            {
                throw new KeyNotFoundException("Sohbet oturumu bulunamadı.");
            }

            EnsureCanAccess(session, userId, role);

            var messages = await _db.ChatMessages
                .AsNoTracking()
                .Where(m => m.SessionId == sessionId && !m.IsDeleted)
                .Include(m => m.Sender)
                .Include(m => m.ProposalLines.Where(l => !l.IsDeleted))
                .OrderBy(m => m.CreatedDate)
                .ToListAsync();

            return messages.Select(MapMessage).ToList();
        }

        public async Task<ChatMessageDto> SendMessageAsync(int sessionId, int senderId, string content)
        {
            var session = await _db.ConsultationSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && !s.IsDeleted);

            if (session is null)
            {
                throw new KeyNotFoundException("Sohbet oturumu bulunamadı.");
            }

            if (session.Status == ConsultationSessionStatus.Closed)
            {
                throw new InvalidOperationException("Bu sohbet oturumu kapatılmış.");
            }

            EnsureIsParticipant(session, senderId);

            var trimmed = content.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
            {
                throw new ArgumentException("Mesaj boş olamaz.");
            }

            var message = new ChatMessage
            {
                SessionId = sessionId,
                SenderId = senderId,
                Content = trimmed,
                Kind = ChatMessageKind.Text,
                CreatedDate = DateTime.UtcNow,
                IsActive = true,
                IsDeleted = false
            };

            session.UpdatedDate = DateTime.UtcNow;

            await _db.ChatMessages.AddAsync(message);
            await _db.SaveChangesAsync();

            var dto = await LoadMessageDtoAsync(message.Id);
            await _realtimeSyncService.BroadcastChatMessageReceivedAsync(sessionId, new ChatMessageReceivedEvent
            {
                Message = dto,
                OccurredAtUtc = DateTime.UtcNow
            });

            return dto;
        }

        public async Task<ChatMessageDto> SendProposalAsync(int sessionId, int consultantId, SendProposalRequest request)
        {
            var session = await _db.ConsultationSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && !s.IsDeleted);

            if (session is null)
            {
                throw new KeyNotFoundException("Sohbet oturumu bulunamadı.");
            }

            if (session.ConsultantId != consultantId)
            {
                throw new UnauthorizedAccessException("Teklif yalnızca oturum danışmanı tarafından gönderilebilir.");
            }

            if (session.Status == ConsultationSessionStatus.Closed)
            {
                throw new InvalidOperationException("Bu sohbet oturumu kapatılmış.");
            }

            var productIds = request.Lines.Select(l => l.ProductId).Distinct().ToList();
            var products = await _db.Products
                .AsNoTracking()
                .Where(p => productIds.Contains(p.Id) && !p.IsDeleted && p.IsActive)
                .ToDictionaryAsync(p => p.Id);

            if (products.Count != productIds.Count)
            {
                throw new InvalidOperationException("Teklifte geçersiz ürün bulundu.");
            }

            var message = new ChatMessage
            {
                SessionId = sessionId,
                SenderId = consultantId,
                Content = request.Title.Trim(),
                Kind = ChatMessageKind.Proposal,
                ProposalTitle = request.Title.Trim(),
                ProposalNotes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
                CreatedDate = DateTime.UtcNow,
                IsActive = true,
                IsDeleted = false
            };

            foreach (var line in request.Lines)
            {
                var product = products[line.ProductId];
                message.ProposalLines.Add(new ChatProposalLine
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Quantity = line.Quantity,
                    UnitPrice = product.Price,
                    CreatedDate = DateTime.UtcNow,
                    IsActive = true,
                    IsDeleted = false
                });
            }

            session.UpdatedDate = DateTime.UtcNow;

            await _db.ChatMessages.AddAsync(message);
            await _db.SaveChangesAsync();

            var dto = await LoadMessageDtoAsync(message.Id);
            await _realtimeSyncService.BroadcastChatMessageReceivedAsync(sessionId, new ChatMessageReceivedEvent
            {
                Message = dto,
                OccurredAtUtc = DateTime.UtcNow
            });

            return dto;
        }

        public async Task EnsureParticipantAsync(int sessionId, int userId)
        {
            var session = await _db.ConsultationSessions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == sessionId && !s.IsDeleted);

            if (session is null)
            {
                throw new KeyNotFoundException("Sohbet oturumu bulunamadı.");
            }

            EnsureIsParticipant(session, userId);
        }

        private IQueryable<ConsultationSession> LoadSessionQuery()
        {
            return _db.ConsultationSessions
                .AsNoTracking()
                .Include(s => s.Customer)
                .Include(s => s.Consultant);
        }

        private async Task<ChatMessageDto> LoadMessageDtoAsync(int messageId)
        {
            var message = await _db.ChatMessages
                .AsNoTracking()
                .Include(m => m.Sender)
                .Include(m => m.ProposalLines.Where(l => !l.IsDeleted))
                .FirstAsync(m => m.Id == messageId);

            return MapMessage(message);
        }

        private static ConsultationSessionDto MapSession(ConsultationSession session, DateTime? lastMessageAt)
        {
            return new ConsultationSessionDto
            {
                Id = session.Id,
                CustomerId = session.CustomerId,
                CustomerName = $"{session.Customer.FirstName} {session.Customer.LastName}".Trim(),
                ConsultantId = session.ConsultantId,
                ConsultantName = $"{session.Consultant.FirstName} {session.Consultant.LastName}".Trim(),
                Title = session.Title,
                Status = session.Status,
                AppointmentId = session.AppointmentId,
                CreatedDate = session.CreatedDate,
                LastMessageAt = lastMessageAt
            };
        }

        private static ChatMessageDto MapMessage(ChatMessage message)
        {
            ProposalDto? proposal = null;
            if (message.Kind == ChatMessageKind.Proposal)
            {
                var lines = message.ProposalLines
                    .Where(l => !l.IsDeleted)
                    .Select(l => new ProposalLineDto
                    {
                        ProductId = l.ProductId,
                        ProductName = l.ProductName,
                        Quantity = l.Quantity,
                        UnitPrice = l.UnitPrice
                    })
                    .ToList();

                proposal = new ProposalDto
                {
                    Title = message.ProposalTitle ?? message.Content,
                    Notes = message.ProposalNotes,
                    Lines = lines
                };
            }

            return new ChatMessageDto
            {
                Id = message.Id,
                SessionId = message.SessionId,
                SenderId = message.SenderId,
                SenderName = $"{message.Sender.FirstName} {message.Sender.LastName}".Trim(),
                Content = message.Content,
                Kind = message.Kind,
                Proposal = proposal,
                CreatedDate = message.CreatedDate
            };
        }

        private static void EnsureCanAccess(ConsultationSession session, int userId, UserRole role)
        {
            if (role == UserRole.Admin)
            {
                return;
            }

            EnsureIsParticipant(session, userId);
        }

        private static void EnsureIsParticipant(ConsultationSession session, int userId)
        {
            if (session.CustomerId != userId && session.ConsultantId != userId)
            {
                throw new UnauthorizedAccessException("Bu sohbet oturumuna erişim yetkiniz yok.");
            }
        }
    }
}
