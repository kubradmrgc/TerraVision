namespace TerraVision.Api.Models.DTOs;

public class CareAssistantChatRequest
{
    public string Message { get; set; } = string.Empty;
    public List<CareAssistantHistoryMessage>? History { get; set; }
    /// <summary>Mağaza ürünü — satın almadan bakım sorusu için (opsiyonel).</summary>
    public int? ProductId { get; set; }
}

public class CareAssistantHistoryMessage
{
    public string Role { get; set; } = "user";
    public string Content { get; set; } = string.Empty;
}

public class CareAssistantChatResponse
{
    public string Reply { get; set; } = string.Empty;
    public string Mode { get; set; } = "fallback";
    public string Disclaimer { get; set; } = string.Empty;
    public IReadOnlyList<CareAssistantPlantSnapshot> Plants { get; set; } = Array.Empty<CareAssistantPlantSnapshot>();
}

public class CareAssistantPlantSnapshot
{
    public int CalendarId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string OverallUrgency { get; set; } = string.Empty;
}
