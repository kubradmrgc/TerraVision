using TerraVision.Api.BackgroundServices;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Services;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Extensions;

public static class CartAbandonmentServiceExtensions
{
    public static IServiceCollection AddTerraVisionCartAbandonment(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        services.Configure<CartAbandonmentSettings>(configuration.GetSection(CartAbandonmentSettings.SectionName));
        services.AddScoped<ICartAbandonmentProcessor, CartAbandonmentProcessor>();

        if (!environment.IsEnvironment("Testing"))
        {
            services.AddHostedService<CartAbandonmentBackgroundService>();
        }

        return services;
    }
}
