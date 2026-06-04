using TerraVision.Api.Interfaces;
using TerraVision.Api.Services;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Extensions;

public static class AiCareAssistantServiceExtensions
{
    public static IServiceCollection AddTerraVisionCareAssistant(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<AiCareAssistantSettings>(configuration.GetSection(AiCareAssistantSettings.SectionName));

        var settings = configuration.GetSection(AiCareAssistantSettings.SectionName).Get<AiCareAssistantSettings>()
                       ?? new AiCareAssistantSettings();

        services.AddHttpClient<ICareAssistantLlmClient, OpenAiCareAssistantClient>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(Math.Clamp(settings.RequestTimeoutSeconds, 10, 120));
        });

        services.AddScoped<ICareAssistantService, CareAssistantService>();
        return services;
    }
}
