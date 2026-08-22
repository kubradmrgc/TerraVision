using TerraVision.Api.Interfaces;

namespace TerraVision.Api.Services.Email;

/// <summary>Development fallback when SMTP is not configured — logs email content instead of sending.</summary>
public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(
        string toAddress,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Email (not sent — SMTP disabled). To={To} Subject={Subject} BodyLength={BodyLength}",
            toAddress,
            subject,
            htmlBody.Length);
        return Task.CompletedTask;
    }
}
