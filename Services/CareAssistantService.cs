using Microsoft.Extensions.Options;
using TerraVision.Api.Data;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Services;

public class CareAssistantService : ICareAssistantService
{
    private readonly ICareService _careService;
    private readonly TerraVisionDbContext _dbContext;
    private readonly ICareAssistantLlmClient _llmClient;
    private readonly AiCareAssistantSettings _settings;
    private readonly ILogger<CareAssistantService> _logger;

    public CareAssistantService(
        ICareService careService,
        TerraVisionDbContext dbContext,
        ICareAssistantLlmClient llmClient,
        IOptions<AiCareAssistantSettings> settings,
        ILogger<CareAssistantService> logger)
    {
        _careService = careService;
        _dbContext = dbContext;
        _llmClient = llmClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<CareAssistantChatResponse> ChatAsync(
        int userId,
        CareAssistantChatRequest request,
        CancellationToken cancellationToken = default)
    {
        var message = ValidateMessage(request.Message);
        var history = NormalizeHistory(request.History);

        var calendar = await _careService.GetMyCalendarAsync(userId);
        var catalogPlants = await CareCatalogMatcher.FindRelevantCatalogPlantsAsync(
            _dbContext,
            userId,
            message,
            request.ProductId,
            cancellationToken);

        var utcNow = DateTime.UtcNow;
        var calendarContext = CareAssistantContextBuilder.BuildUserContext(calendar, utcNow);
        var catalogContext = CareAssistantContextBuilder.BuildCatalogContext(catalogPlants);
        var context = CareAssistantContextBuilder.CombineContext(calendarContext, catalogContext);
        var snapshots = CareAssistantContextBuilder.BuildSnapshots(calendar);
        var hasCatalog = catalogPlants.Count > 0;

        string reply;
        string mode;

        if (_settings.UseLlm)
        {
            try
            {
                reply = await _llmClient.CompleteAsync(
                    CareAssistantContextBuilder.BuildSystemPrompt(hasCatalog),
                    context,
                    message,
                    history,
                    cancellationToken);
                mode = "llm";
            }
            catch (Exception ex) when (ex is InvalidOperationException or HttpRequestException or TaskCanceledException)
            {
                _logger.LogWarning(ex, "Care assistant LLM failed; using fallback for user {UserId}", userId);
                reply = CareAssistantFallbackResponder.Generate(message, calendar, catalogPlants);
                mode = "fallback";
            }
        }
        else
        {
            reply = CareAssistantFallbackResponder.Generate(message, calendar, catalogPlants);
            mode = "fallback";
        }

        return new CareAssistantChatResponse
        {
            Reply = reply.Trim(),
            Mode = mode,
            Disclaimer = CareAssistantContextBuilder.Disclaimer,
            Plants = snapshots
        };
    }

    private string ValidateMessage(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            throw new ArgumentException("Mesaj boş olamaz.");
        }

        var trimmed = message.Trim();
        if (trimmed.Length > _settings.MaxUserMessageLength)
        {
            throw new ArgumentException($"Mesaj en fazla {_settings.MaxUserMessageLength} karakter olabilir.");
        }

        return trimmed;
    }

    private IReadOnlyList<(string Role, string Content)> NormalizeHistory(List<CareAssistantHistoryMessage>? history)
    {
        if (history == null || history.Count == 0)
        {
            return Array.Empty<(string, string)>();
        }

        if (history.Count > _settings.MaxHistoryMessages)
        {
            throw new ArgumentException($"Geçmiş en fazla {_settings.MaxHistoryMessages} mesaj içerebilir.");
        }

        var result = new List<(string Role, string Content)>();
        foreach (var item in history)
        {
            var role = item.Role?.Trim().ToLowerInvariant();
            if (role is not "user" and not "assistant")
            {
                throw new ArgumentException("Geçmiş mesajları yalnızca 'user' veya 'assistant' rolüne sahip olabilir.");
            }

            var content = item.Content?.Trim() ?? string.Empty;
            if (content.Length == 0)
            {
                throw new ArgumentException("Geçmiş mesaj içeriği boş olamaz.");
            }

            if (content.Length > _settings.MaxUserMessageLength)
            {
                throw new ArgumentException($"Geçmiş mesajları en fazla {_settings.MaxUserMessageLength} karakter olabilir.");
            }

            result.Add((role, content));
        }

        return result;
    }
}
