namespace TerraVision.Api.Settings;

public class CartAbandonmentSettings
{
    public const string SectionName = "CartAbandonment";

    /// <summary>Hours without checkout after the last cart change before abandonment is detected.</summary>
    public int AbandonmentThresholdHours { get; set; } = 24;

    /// <summary>How often the background worker scans for abandoned carts.</summary>
    public int ScanIntervalMinutes { get; set; } = 15;

    public bool SendReminderEmail { get; set; } = true;

    public string EmailSubject { get; set; } = "Sepetinizde bitkileriniz sizi bekliyor!";

    /// <summary>Storefront cart page URL included in the reminder email.</summary>
    public string CartPageUrl { get; set; } = "http://localhost:3000/cart";
}
