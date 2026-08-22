using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TerraVision.Api.Data;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.Realtime;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Services;

public class CartAbandonmentProcessor : ICartAbandonmentProcessor
{
    private readonly TerraVisionDbContext _dbContext;
    private readonly IRealtimeSyncService _realtimeSyncService;
    private readonly ICartAbandonmentEmailNotifier _emailNotifier;
    private readonly CartAbandonmentSettings _settings;
    private readonly ILogger<CartAbandonmentProcessor> _logger;

    public CartAbandonmentProcessor(
        TerraVisionDbContext dbContext,
        IRealtimeSyncService realtimeSyncService,
        ICartAbandonmentEmailNotifier emailNotifier,
        IOptions<CartAbandonmentSettings> settings,
        ILogger<CartAbandonmentProcessor> logger)
    {
        _dbContext = dbContext;
        _realtimeSyncService = realtimeSyncService;
        _emailNotifier = emailNotifier;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<int> ProcessAbandonedCartsAsync(CancellationToken cancellationToken = default)
    {
        var thresholdHours = _settings.AbandonmentThresholdHours < 1
            ? 24
            : _settings.AbandonmentThresholdHours;
        var inactiveSince = DateTime.UtcNow.AddHours(-thresholdHours);

        var candidates = await (
            from cart in _dbContext.Carts.AsNoTracking()
            join user in _dbContext.Users.AsNoTracking() on cart.UserId equals user.Id
            where !cart.IsDeleted
                  && !user.IsDeleted
                  && user.Role == UserRole.Customer
                  && cart.LastActivityAtUtc != null
                  && cart.LastActivityAtUtc <= inactiveSince
                  && (cart.AbandonedNotifiedAtUtc == null || cart.AbandonedNotifiedAtUtc < cart.LastActivityAtUtc)
                  && _dbContext.CartItems.Any(ci => ci.CartId == cart.Id && !ci.IsDeleted)
                  && !_dbContext.Orders.Any(o =>
                      o.UserId == cart.UserId
                      && !o.IsDeleted
                      && o.CreatedDate >= cart.LastActivityAtUtc)
            select new { cart.Id, cart.UserId, cart.LastActivityAtUtc, user.Email, user.FirstName }
        ).ToListAsync(cancellationToken);

        if (candidates.Count == 0)
        {
            return 0;
        }

        var published = 0;
        var now = DateTime.UtcNow;

        foreach (var candidate in candidates)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var trackedCart = await _dbContext.Carts
                .SingleOrDefaultAsync(c => c.Id == candidate.Id && !c.IsDeleted, cancellationToken);
            if (trackedCart == null)
            {
                continue;
            }

            if (trackedCart.LastActivityAtUtc == null
                || trackedCart.LastActivityAtUtc > inactiveSince
                || (trackedCart.AbandonedNotifiedAtUtc != null
                    && trackedCart.AbandonedNotifiedAtUtc >= trackedCart.LastActivityAtUtc))
            {
                continue;
            }

            var hasActiveItems = await _dbContext.CartItems
                .AnyAsync(ci => ci.CartId == trackedCart.Id && !ci.IsDeleted, cancellationToken);
            if (!hasActiveItems)
            {
                continue;
            }

            var hasRecentOrder = await _dbContext.Orders.AnyAsync(
                o => o.UserId == trackedCart.UserId
                     && !o.IsDeleted
                     && o.CreatedDate >= trackedCart.LastActivityAtUtc,
                cancellationToken);
            if (hasRecentOrder)
            {
                continue;
            }

            var lineItems = await _dbContext.CartItems
                .Where(ci => ci.CartId == trackedCart.Id && !ci.IsDeleted)
                .Join(_dbContext.Products,
                    ci => ci.ProductId,
                    p => p.Id,
                    (ci, p) => new { ci.Quantity, p.Price, p.Name })
                .ToListAsync(cancellationToken);

            var cartEvent = new CartAbandonedEvent
            {
                UserId = trackedCart.UserId,
                CartId = trackedCart.Id,
                CustomerEmail = candidate.Email,
                TotalAmount = lineItems.Sum(x => x.Price * x.Quantity),
                ItemCount = lineItems.Count,
                LastActivityAtUtc = trackedCart.LastActivityAtUtc.Value,
                OccurredAtUtc = now
            };

            try
            {
                await _emailNotifier.SendAbandonedCartReminderAsync(
                    new CartAbandonmentEmailMessage
                    {
                        ToEmail = candidate.Email,
                        FirstName = candidate.FirstName,
                        TotalAmount = cartEvent.TotalAmount,
                        ItemCount = cartEvent.ItemCount,
                        ProductNames = lineItems.Select(x => x.Name).ToList()
                    },
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Cart abandonment email failed for user {UserId}, cart {CartId}; will retry on next scan",
                    cartEvent.UserId,
                    cartEvent.CartId);
                continue;
            }

            await _realtimeSyncService.BroadcastCartAbandonedAsync(cartEvent, cancellationToken);

            trackedCart.AbandonedNotifiedAtUtc = now;
            trackedCart.UpdatedDate = now;
            await _dbContext.SaveChangesAsync(cancellationToken);

            published++;
            _logger.LogInformation(
                "Published customer.cart.abandoned for user {UserId}, cart {CartId}, total {TotalAmount}",
                cartEvent.UserId,
                cartEvent.CartId,
                cartEvent.TotalAmount);
        }

        return published;
    }
}
