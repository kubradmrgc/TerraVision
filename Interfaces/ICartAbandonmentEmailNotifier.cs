namespace TerraVision.Api.Interfaces;

public interface ICartAbandonmentEmailNotifier
{
    Task SendAbandonedCartReminderAsync(CartAbandonmentEmailMessage message, CancellationToken cancellationToken = default);
}

public sealed class CartAbandonmentEmailMessage
{
    public string ToEmail { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public int ItemCount { get; init; }
    public IReadOnlyList<string> ProductNames { get; init; } = [];
}
