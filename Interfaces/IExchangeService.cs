using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces
{
    public interface IExchangeService
    {
        Task<IReadOnlyList<ExchangeProductDto>> ListActiveProductsAsync(
            ExchangeCondition? condition = null,
            bool? swapOnly = null,
            CancellationToken cancellationToken = default);

        Task<ExchangeProductDto> GetProductByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<ExchangeProductDto>> GetMyProductsAsync(int ownerId, CancellationToken cancellationToken = default);
        Task<ExchangeProductDto> CreateProductAsync(int ownerId, CreateExchangeProductRequest request, CancellationToken cancellationToken = default);
        Task<ExchangeProductDto> UpdateProductAsync(int ownerId, UpdateExchangeProductRequest request, CancellationToken cancellationToken = default);
        Task DeleteProductAsync(int ownerId, int productId, CancellationToken cancellationToken = default);

        Task<ExchangeOfferDto> CreateOfferAsync(int senderId, CreateExchangeOfferRequest request, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<ExchangeOfferDto>> GetReceivedOffersAsync(int ownerId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<ExchangeOfferDto>> GetSentOffersAsync(int senderId, CancellationToken cancellationToken = default);
        Task<ExchangeOfferDto> UpdateOfferStatusAsync(int ownerId, UpdateExchangeOfferStatusRequest request, CancellationToken cancellationToken = default);
    }
}
