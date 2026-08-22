namespace TerraVision.Api.Interfaces;

public interface IEmailSender
{
    Task SendAsync(string toAddress, string subject, string htmlBody, CancellationToken cancellationToken = default);
}
