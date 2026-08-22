namespace TerraVision.Api.Interfaces;

public interface ICareAssistantLlmClient
{
    Task<string> CompleteAsync(
        string systemPrompt,
        string userContext,
        string userMessage,
        IReadOnlyList<(string Role, string Content)> history,
        CancellationToken cancellationToken = default);
}
