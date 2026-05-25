using TerraVision.Api.Interfaces;
using TerraVision.Api.Services;
using TerraVision.Api.Services.Email;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Extensions;

public static class EmailServiceExtensions
{
    public static IServiceCollection AddTerraVisionEmail(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
        var emailSettings = configuration.GetSection(EmailSettings.SectionName).Get<EmailSettings>() ?? new EmailSettings();

        if (emailSettings.IsConfigured)
        {
            services.AddSingleton<IEmailSender, SmtpEmailSender>();
        }
        else
        {
            services.AddSingleton<IEmailSender, LoggingEmailSender>();
        }

        services.AddScoped<ICartAbandonmentEmailNotifier, CartAbandonmentEmailNotifier>();
        return services;
    }
}
