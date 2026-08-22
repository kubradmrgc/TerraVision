using System.Globalization;
using System.Net;
using Microsoft.Extensions.Options;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Services;

public class CartAbandonmentEmailNotifier : ICartAbandonmentEmailNotifier
{
    private readonly IEmailSender _emailSender;
    private readonly CartAbandonmentSettings _settings;
    private readonly ILogger<CartAbandonmentEmailNotifier> _logger;

    public CartAbandonmentEmailNotifier(
        IEmailSender emailSender,
        IOptions<CartAbandonmentSettings> settings,
        ILogger<CartAbandonmentEmailNotifier> logger)
    {
        _emailSender = emailSender;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendAbandonedCartReminderAsync(
        CartAbandonmentEmailMessage message,
        CancellationToken cancellationToken = default)
    {
        if (!_settings.SendReminderEmail)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(message.ToEmail))
        {
            _logger.LogWarning("Skipped cart abandonment email: recipient address is empty.");
            return;
        }

        var greetingName = string.IsNullOrWhiteSpace(message.FirstName) ? "Merhaba" : message.FirstName.Trim();
        var total = message.TotalAmount.ToString("N2", CultureInfo.GetCultureInfo("tr-TR"));
        var productList = message.ProductNames.Count == 0
            ? "<li>Sepetinizde ürünler var</li>"
            : string.Join("", message.ProductNames.Select(name => $"<li>{WebUtility.HtmlEncode(name)}</li>"));
        var cartUrl = WebUtility.HtmlEncode(_settings.CartPageUrl.Trim());

        var html = $"""
            <!DOCTYPE html>
            <html lang="tr">
            <body style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#1a3d2e;">
              <p>{WebUtility.HtmlEncode(greetingName)},</p>
              <p><strong>Sepetinizde bitkileriniz sizi bekliyor!</strong></p>
              <p>Sepetinizde {message.ItemCount} ürün ve toplam <strong>{total} ₺</strong> tutarında seçimleriniz var.</p>
              <ul>{productList}</ul>
              <p>
                <a href="{cartUrl}" style="display:inline-block;padding:12px 20px;background:#2d6a4f;color:#fff;text-decoration:none;border-radius:8px;">
                  Sepetime dön
                </a>
              </p>
              <p style="color:#5c6b63;font-size:0.9em;">TerraVision — doğayı evinize taşıyın.</p>
            </body>
            </html>
            """;

        await _emailSender.SendAsync(message.ToEmail, _settings.EmailSubject, html, cancellationToken);
    }
}
