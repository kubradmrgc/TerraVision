using System.Data;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services
{
    public class ExchangeService : IExchangeService
    {
        private static readonly JsonSerializerOptions PhotoJsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        private readonly IRepository<ExchangeProduct> _productRepository;
        private readonly IRepository<ExchangeOffer> _offerRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly TerraVisionDbContext _dbContext;
        private readonly IRealtimeSyncService _realtimeSyncService;
        private readonly INotificationService _notificationService;

        public ExchangeService(
            IRepository<ExchangeProduct> productRepository,
            IRepository<ExchangeOffer> offerRepository,
            IRepository<User> userRepository,
            IUnitOfWork unitOfWork,
            TerraVisionDbContext dbContext,
            IRealtimeSyncService realtimeSyncService,
            INotificationService notificationService)
        {
            _productRepository = productRepository;
            _offerRepository = offerRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _dbContext = dbContext;
            _realtimeSyncService = realtimeSyncService;
            _notificationService = notificationService;
        }

        public async Task<IReadOnlyList<ExchangeProductDto>> ListActiveProductsAsync(
            ExchangeCondition? condition = null,
            bool? swapOnly = null,
            CancellationToken cancellationToken = default)
        {
            var query = _productRepository.Find(p =>
                !p.IsDeleted &&
                p.IsActive &&
                p.Status == ExchangeProductStatus.Available);

            if (condition.HasValue)
            {
                query = query.Where(p => p.Condition == condition.Value);
            }

            if (swapOnly == true)
            {
                query = query.Where(p => p.Price == 0);
            }
            else if (swapOnly == false)
            {
                query = query.Where(p => p.Price > 0);
            }

            var products = await query
                .OrderByDescending(p => p.CreatedDate)
                .ToListAsync(cancellationToken);

            return await MapProductsAsync(products, cancellationToken);
        }

        public async Task<ExchangeProductDto> GetProductByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var product = await _productRepository.SingleOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
            if (product == null)
            {
                throw new KeyNotFoundException("Exchange product not found.");
            }

            var mapped = await MapProductsAsync([product], cancellationToken);
            return mapped[0];
        }

        public async Task<IReadOnlyList<ExchangeProductDto>> GetMyProductsAsync(int ownerId, CancellationToken cancellationToken = default)
        {
            var products = await _productRepository
                .Find(p => p.OwnerId == ownerId && !p.IsDeleted)
                .OrderByDescending(p => p.CreatedDate)
                .ToListAsync(cancellationToken);

            return await MapProductsAsync(products, cancellationToken);
        }

        public async Task<ExchangeProductDto> CreateProductAsync(int ownerId, CreateExchangeProductRequest request, CancellationToken cancellationToken = default)
        {
            ValidateProductRequest(request.Title, request.Description, request.Price, request.PhotoUrls);

            var product = new ExchangeProduct
            {
                OwnerId = ownerId,
                Title = request.Title.Trim(),
                Description = request.Description.Trim(),
                Price = request.Price,
                Condition = request.Condition,
                PhotoUrlsJson = SerializePhotoUrls(request.PhotoUrls),
                Status = ExchangeProductStatus.Available,
                IsActive = true
            };

            await _productRepository.AddAsync(product);
            await _unitOfWork.CommitAsync();

            var dto = (await MapProductsAsync([product], cancellationToken))[0];
            await _realtimeSyncService.BroadcastExchangeProductListedAsync(dto);
            return dto;
        }

        public async Task<ExchangeProductDto> UpdateProductAsync(int ownerId, UpdateExchangeProductRequest request, CancellationToken cancellationToken = default)
        {
            var product = await _productRepository.SingleOrDefaultAsync(p => p.Id == request.Id && !p.IsDeleted);
            if (product == null)
            {
                throw new KeyNotFoundException("Exchange product not found.");
            }

            if (product.OwnerId != ownerId)
            {
                throw new UnauthorizedAccessException("You can only update your own listings.");
            }

            ValidateProductRequest(request.Title, request.Description, request.Price, request.PhotoUrls);

            product.Title = request.Title.Trim();
            product.Description = request.Description.Trim();
            product.Price = request.Price;
            product.Condition = request.Condition;
            product.PhotoUrlsJson = SerializePhotoUrls(request.PhotoUrls);
            product.IsActive = request.IsActive;
            product.Status = request.Status;
            product.UpdatedDate = DateTime.UtcNow;

            _productRepository.Update(product);
            await _unitOfWork.CommitAsync();

            return (await MapProductsAsync([product], cancellationToken))[0];
        }

        public async Task DeleteProductAsync(int ownerId, int productId, CancellationToken cancellationToken = default)
        {
            var product = await _productRepository.SingleOrDefaultAsync(p => p.Id == productId && !p.IsDeleted);
            if (product == null)
            {
                throw new KeyNotFoundException("Exchange product not found.");
            }

            if (product.OwnerId != ownerId)
            {
                throw new UnauthorizedAccessException("You can only delete your own listings.");
            }

            product.IsDeleted = true;
            product.IsActive = false;
            product.UpdatedDate = DateTime.UtcNow;
            _productRepository.Update(product);
            await _unitOfWork.CommitAsync();
        }

        public async Task<ExchangeOfferDto> CreateOfferAsync(int senderId, CreateExchangeOfferRequest request, CancellationToken cancellationToken = default)
        {
            var product = await _productRepository.SingleOrDefaultAsync(p => p.Id == request.ProductId && !p.IsDeleted && p.IsActive);
            if (product == null)
            {
                throw new KeyNotFoundException("Exchange product not found.");
            }

            if (product.OwnerId == senderId)
            {
                throw new ArgumentException("You cannot make an offer on your own listing.");
            }

            if (product.Status != ExchangeProductStatus.Available)
            {
                throw new InvalidOperationException("This listing is no longer accepting offers.");
            }

            var sanitizedMessage = ExchangeMessageSanitizer.Sanitize(request.Message);
            if (request.OfferType == ExchangeOfferType.Buy && product.Price <= 0)
            {
                throw new ArgumentException("This listing is swap-only.");
            }

            var sender = await _userRepository.SingleOrDefaultAsync(u => u.Id == senderId && !u.IsDeleted);
            if (sender == null)
            {
                throw new KeyNotFoundException("Sender not found.");
            }

            var offer = new ExchangeOffer
            {
                ProductId = product.Id,
                SenderId = senderId,
                OfferType = request.OfferType,
                Message = sanitizedMessage,
                Status = ExchangeOfferStatus.Pending
            };

            await _offerRepository.AddAsync(offer);
            await _unitOfWork.CommitAsync();

            var dto = await MapOfferAsync(offer, product, sender, cancellationToken);
            await _realtimeSyncService.BroadcastExchangeOfferReceivedAsync(new Models.Realtime.ExchangeOfferReceivedEvent
            {
                OfferId = offer.Id,
                ProductId = product.Id,
                ProductTitle = product.Title,
                OwnerId = product.OwnerId,
                SenderId = senderId,
                SenderDisplayName = FormatDisplayName(sender),
                OfferType = offer.OfferType,
                Message = offer.Message
            });

            await _notificationService.CreateAsync(
                product.OwnerId,
                NotificationType.ExchangeOfferReceived,
                "Yeni takas teklifi",
                $"{FormatDisplayName(sender)}, \"{product.Title}\" ilanınıza {DescribeOfferType(offer.OfferType)} teklifi gönderdi.",
                relatedEntityType: "ExchangeOffer",
                relatedEntityId: offer.Id,
                cancellationToken: cancellationToken);

            return dto;
        }

        public async Task<IReadOnlyList<ExchangeOfferDto>> GetReceivedOffersAsync(int ownerId, CancellationToken cancellationToken = default)
        {
            var offers = await _offerRepository
                .Find(o => !o.IsDeleted && o.Product.OwnerId == ownerId)
                .Include(o => o.Product)
                .Include(o => o.Sender)
                .OrderByDescending(o => o.CreatedDate)
                .ToListAsync(cancellationToken);

            var results = new List<ExchangeOfferDto>();
            foreach (var offer in offers)
            {
                results.Add(await MapOfferAsync(offer, offer.Product, offer.Sender, cancellationToken));
            }

            return results;
        }

        public async Task<IReadOnlyList<ExchangeOfferDto>> GetSentOffersAsync(int senderId, CancellationToken cancellationToken = default)
        {
            var offers = await _offerRepository
                .Find(o => !o.IsDeleted && o.SenderId == senderId)
                .Include(o => o.Product)
                .Include(o => o.Sender)
                .OrderByDescending(o => o.CreatedDate)
                .ToListAsync(cancellationToken);

            var results = new List<ExchangeOfferDto>();
            foreach (var offer in offers)
            {
                results.Add(await MapOfferAsync(offer, offer.Product, offer.Sender, cancellationToken));
            }

            return results;
        }

        public async Task<ExchangeOfferDto> UpdateOfferStatusAsync(int ownerId, UpdateExchangeOfferStatusRequest request, CancellationToken cancellationToken = default)
        {
            if (request.Status is not (ExchangeOfferStatus.Accepted or ExchangeOfferStatus.Rejected))
            {
                throw new ArgumentException("Status must be Accepted or Rejected.");
            }

            await using var transaction = _dbContext.Database.IsRelational()
                ? await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken)
                : null;

            var offer = await _offerRepository
                .Find(o => o.Id == request.Id && !o.IsDeleted)
                .Include(o => o.Product)
                .Include(o => o.Sender)
                .FirstOrDefaultAsync(cancellationToken);

            if (offer == null)
            {
                throw new KeyNotFoundException("Offer not found.");
            }

            if (offer.Product.OwnerId != ownerId)
            {
                throw new UnauthorizedAccessException("Only the listing owner can respond to offers.");
            }

            if (offer.Status != ExchangeOfferStatus.Pending)
            {
                throw new InvalidOperationException("This offer has already been resolved.");
            }

            var rejectedSiblings = new List<ExchangeOffer>();

            if (request.Status == ExchangeOfferStatus.Accepted)
            {
                if (offer.Product.Status != ExchangeProductStatus.Available)
                {
                    throw new InvalidOperationException("This listing is no longer accepting offers.");
                }

                offer.Product.Status = ExchangeProductStatus.Pending;
                offer.Product.UpdatedDate = DateTime.UtcNow;
                _productRepository.Update(offer.Product);

                rejectedSiblings = await _offerRepository
                    .Find(o =>
                        o.ProductId == offer.ProductId &&
                        o.Id != offer.Id &&
                        !o.IsDeleted &&
                        o.Status == ExchangeOfferStatus.Pending)
                    .Include(o => o.Sender)
                    .Include(o => o.Product)
                    .ToListAsync(cancellationToken);

                var rejectedAt = DateTime.UtcNow;
                foreach (var sibling in rejectedSiblings)
                {
                    sibling.Status = ExchangeOfferStatus.Rejected;
                    sibling.UpdatedDate = rejectedAt;
                    _offerRepository.Update(sibling);
                }
            }

            offer.Status = request.Status;
            offer.UpdatedDate = DateTime.UtcNow;
            _offerRepository.Update(offer);

            await _unitOfWork.CommitAsync();
            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            await NotifyOfferStatusChangedAsync(offer, cancellationToken);
            foreach (var sibling in rejectedSiblings)
            {
                await NotifyOfferStatusChangedAsync(sibling, cancellationToken);
            }

            return await MapOfferAsync(offer, offer.Product, offer.Sender, cancellationToken);
        }

        private async Task NotifyOfferStatusChangedAsync(ExchangeOffer offer, CancellationToken cancellationToken)
        {
            await _realtimeSyncService.BroadcastExchangeOfferStatusChangedAsync(new Models.Realtime.ExchangeOfferStatusChangedEvent
            {
                OfferId = offer.Id,
                ProductId = offer.ProductId,
                SenderId = offer.SenderId,
                Status = offer.Status
            });

            await _notificationService.CreateAsync(
                offer.SenderId,
                NotificationType.ExchangeOfferStatusChanged,
                "Takas teklifiniz güncellendi",
                $"\"{offer.Product.Title}\" ilanına gönderdiğiniz teklif {DescribeOfferStatus(offer.Status)}.",
                relatedEntityType: "ExchangeOffer",
                relatedEntityId: offer.Id,
                cancellationToken: cancellationToken);
        }

        private static void ValidateProductRequest(string title, string description, decimal price, List<string> photoUrls)
        {
            if (string.IsNullOrWhiteSpace(title) || title.Trim().Length > 120)
            {
                throw new ArgumentException("Title is required and must be 120 characters or fewer.");
            }

            if (description.Length > 2000)
            {
                throw new ArgumentException("Description must be 2000 characters or fewer.");
            }

            if (price < 0)
            {
                throw new ArgumentException("Price cannot be negative.");
            }

            if (photoUrls.Count == 0 || photoUrls.Count > 6)
            {
                throw new ArgumentException("Provide between 1 and 6 photos.");
            }
        }

        private static string SerializePhotoUrls(IEnumerable<string> urls)
        {
            var cleaned = urls
                .Where(u => !string.IsNullOrWhiteSpace(u))
                .Select(u => u.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(6)
                .ToList();

            return JsonSerializer.Serialize(cleaned, PhotoJsonOptions);
        }

        private static IReadOnlyList<string> DeserializePhotoUrls(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return Array.Empty<string>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<string>>(json, PhotoJsonOptions) ?? [];
            }
            catch
            {
                return Array.Empty<string>();
            }
        }

        private async Task<IReadOnlyList<ExchangeProductDto>> MapProductsAsync(
            IReadOnlyList<ExchangeProduct> products,
            CancellationToken cancellationToken)
        {
            if (products.Count == 0)
            {
                return Array.Empty<ExchangeProductDto>();
            }

            var ownerIds = products.Select(p => p.OwnerId).Distinct().ToList();
            var owners = await _userRepository
                .Find(u => ownerIds.Contains(u.Id) && !u.IsDeleted)
                .ToListAsync(cancellationToken);
            var ownerMap = owners.ToDictionary(o => o.Id);

            return products.Select(p =>
            {
                ownerMap.TryGetValue(p.OwnerId, out var owner);
                return new ExchangeProductDto
                {
                    Id = p.Id,
                    OwnerId = p.OwnerId,
                    OwnerDisplayName = owner == null ? "Member" : FormatDisplayName(owner),
                    Title = p.Title,
                    Description = p.Description,
                    Price = p.Price,
                    IsSwapOnly = p.Price == 0,
                    Condition = p.Condition,
                    PhotoUrls = DeserializePhotoUrls(p.PhotoUrlsJson),
                    IsActive = p.IsActive,
                    Status = p.Status,
                    CreatedDate = p.CreatedDate
                };
            }).ToList();
        }

        private Task<ExchangeOfferDto> MapOfferAsync(
            ExchangeOffer offer,
            ExchangeProduct product,
            User sender,
            CancellationToken cancellationToken)
        {
            _ = cancellationToken;
            return Task.FromResult(new ExchangeOfferDto
            {
                Id = offer.Id,
                ProductId = offer.ProductId,
                ProductTitle = product.Title,
                SenderId = offer.SenderId,
                SenderDisplayName = FormatDisplayName(sender),
                OwnerId = product.OwnerId,
                OfferType = offer.OfferType,
                Message = offer.Message,
                Status = offer.Status,
                CreatedDate = offer.CreatedDate
            });
        }

        private static string FormatDisplayName(User user) =>
            $"{user.FirstName} {user.LastName}".Trim();

        private static string DescribeOfferType(ExchangeOfferType offerType) => offerType switch
        {
            ExchangeOfferType.Swap => "takas",
            ExchangeOfferType.Buy => "satın alma",
            _ => offerType.ToString()
        };

        private static string DescribeOfferStatus(ExchangeOfferStatus status) => status switch
        {
            ExchangeOfferStatus.Accepted => "kabul edildi",
            ExchangeOfferStatus.Rejected => "reddedildi",
            ExchangeOfferStatus.Pending => "beklemede",
            _ => status.ToString()
        };
    }
}
