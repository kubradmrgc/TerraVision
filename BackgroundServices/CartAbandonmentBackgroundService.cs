using Microsoft.Extensions.Options;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Settings;

namespace TerraVision.Api.BackgroundServices;

public class CartAbandonmentBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly CartAbandonmentSettings _settings;
    private readonly ILogger<CartAbandonmentBackgroundService> _logger;

    public CartAbandonmentBackgroundService(
        IServiceScopeFactory scopeFactory,
        IOptions<CartAbandonmentSettings> settings,
        ILogger<CartAbandonmentBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _settings = settings.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var intervalMinutes = _settings.ScanIntervalMinutes < 1 ? 15 : _settings.ScanIntervalMinutes;
        var delay = TimeSpan.FromMinutes(intervalMinutes);

        _logger.LogInformation(
            "Cart abandonment worker started (threshold {ThresholdHours}h, scan every {IntervalMinutes}m)",
            _settings.AbandonmentThresholdHours,
            intervalMinutes);

        using var timer = new PeriodicTimer(delay);

        do
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var processor = scope.ServiceProvider.GetRequiredService<ICartAbandonmentProcessor>();
                var published = await processor.ProcessAbandonedCartsAsync(stoppingToken);
                if (published > 0)
                {
                    _logger.LogInformation("Cart abandonment scan published {Count} event(s)", published);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cart abandonment scan failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
