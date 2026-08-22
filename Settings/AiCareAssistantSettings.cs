namespace TerraVision.Api.Settings;

public class AiCareAssistantSettings
{
    public const string SectionName = "AiCareAssistant";

    public bool Enabled { get; set; } = true;

    /// <summary>OpenAI-compatible chat completions URL.</summary>
    public string Endpoint { get; set; } = "https://api.openai.com/v1/chat/completions";

    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = "gpt-4o-mini";

    public double Temperature { get; set; } = 0.4;

    public int MaxOutputTokens { get; set; } = 800;

    public int MaxUserMessageLength { get; set; } = 2000;

    public int MaxHistoryMessages { get; set; } = 10;

    public int RequestTimeoutSeconds { get; set; } = 60;

    public bool UseLlm =>
        Enabled && !string.IsNullOrWhiteSpace(ApiKey);
}
