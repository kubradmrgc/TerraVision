namespace TerraVision.Api.Settings;

public class EmailSettings
{
    public const string SectionName = "Email";

    public bool Enabled { get; set; }

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string FromAddress { get; set; } = "noreply@terravision.local";
    public string FromDisplayName { get; set; } = "TerraVision";

    public bool IsConfigured =>
        Enabled
        && !string.IsNullOrWhiteSpace(Host)
        && !string.IsNullOrWhiteSpace(FromAddress);
}
