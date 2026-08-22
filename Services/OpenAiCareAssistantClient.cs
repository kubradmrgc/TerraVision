using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Services;

public class OpenAiCareAssistantClient : ICareAssistantLlmClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _httpClient;
    private readonly AiCareAssistantSettings _settings;
    private readonly ILogger<OpenAiCareAssistantClient> _logger;

    public OpenAiCareAssistantClient(
        HttpClient httpClient,
        IOptions<AiCareAssistantSettings> settings,
        ILogger<OpenAiCareAssistantClient> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<string> CompleteAsync(
        string systemPrompt,
        string userContext,
        string userMessage,
        IReadOnlyList<(string Role, string Content)> history,
        CancellationToken cancellationToken = default)
    {
        var messages = new List<ChatMessagePayload>
        {
            new("system", systemPrompt),
            new("system", "Kullanıcı bakım takvimi verisi:\n" + userContext)
        };

        foreach (var (role, content) in history)
        {
            messages.Add(new ChatMessagePayload(role, content));
        }

        messages.Add(new ChatMessagePayload("user", userMessage));

        var payload = new ChatCompletionRequest
        {
            Model = _settings.Model,
            Messages = messages,
            Temperature = _settings.Temperature,
            MaxTokens = _settings.MaxOutputTokens
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, _settings.Endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOptions),
            Encoding.UTF8,
            "application/json");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Care assistant LLM request failed. Status={StatusCode} BodyLength={BodyLength}",
                (int)response.StatusCode,
                body.Length);
            throw new InvalidOperationException("Yapay zeka servisi şu an yanıt veremedi.");
        }

        var parsed = JsonSerializer.Deserialize<ChatCompletionResponse>(body, JsonOptions);
        var reply = parsed?.Choices?.FirstOrDefault()?.Message?.Content?.Trim();
        if (string.IsNullOrWhiteSpace(reply))
        {
            throw new InvalidOperationException("Yapay zeka servisi boş yanıt döndü.");
        }

        return reply;
    }

    private sealed class ChatCompletionRequest
    {
        public string Model { get; set; } = string.Empty;
        public List<ChatMessagePayload> Messages { get; set; } = [];
        public double Temperature { get; set; }
        [JsonPropertyName("max_tokens")]
        public int MaxTokens { get; set; }
    }

    private sealed record ChatMessagePayload(string Role, string Content);

    private sealed class ChatCompletionResponse
    {
        public List<ChatChoice>? Choices { get; set; }
    }

    private sealed class ChatChoice
    {
        public ChatMessagePayload? Message { get; set; }
    }
}
