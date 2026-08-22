namespace TerraVision.Api.Interfaces;

public interface ICartAbandonmentProcessor
{
    /// <summary>
    /// Finds customer carts inactive for the configured threshold and publishes
    /// <c>customer.cart.abandoned</c> once per activity window.
    /// </summary>
    /// <returns>Number of abandonment events published.</returns>
    Task<int> ProcessAbandonedCartsAsync(CancellationToken cancellationToken = default);
}
