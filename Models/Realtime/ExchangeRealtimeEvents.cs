using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Models.Realtime
{
    public sealed class ExchangeOfferReceivedEvent
    {
        public int OfferId { get; set; }
        public int ProductId { get; set; }
        public string ProductTitle { get; set; } = string.Empty;
        public int OwnerId { get; set; }
        public int SenderId { get; set; }
        public string SenderDisplayName { get; set; } = string.Empty;
        public ExchangeOfferType OfferType { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    }

    public sealed class ExchangeOfferStatusChangedEvent
    {
        public int OfferId { get; set; }
        public int ProductId { get; set; }
        public int SenderId { get; set; }
        public ExchangeOfferStatus Status { get; set; }
        public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    }

    public sealed class ExchangeProductListedEvent
    {
        public ExchangeProductDto Product { get; set; } = null!;
        public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    }
}
