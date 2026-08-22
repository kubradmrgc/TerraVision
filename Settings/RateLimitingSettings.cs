namespace TerraVision.Api.Settings;

public class RateLimitingSettings
{
    public const string SectionName = "RateLimiting";

    public RateLimitPolicySettings AuthSensitive { get; set; } = new() { PermitLimit = 5, WindowMinutes = 1 };
    public RateLimitPolicySettings AppointmentsWrite { get; set; } = new() { PermitLimit = 10, WindowMinutes = 1 };
    public RateLimitPolicySettings CatalogRead { get; set; } = new() { PermitLimit = 120, WindowMinutes = 1 };
    public RateLimitPolicySettings CareAssistantChat { get; set; } = new() { PermitLimit = 20, WindowMinutes = 1 };
    public RateLimitPolicySettings SupportFeedback { get; set; } = new() { PermitLimit = 5, WindowMinutes = 1 };
}

public class RateLimitPolicySettings
{
    public int PermitLimit { get; set; } = 60;
    public int WindowMinutes { get; set; } = 1;
}
