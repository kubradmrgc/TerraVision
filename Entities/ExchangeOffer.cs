using TerraVision.Api.Entities.Common;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Entities
{
    public class ExchangeOffer : BaseEntity
    {
        public int ProductId { get; set; }
        public int SenderId { get; set; }
        public ExchangeOfferType OfferType { get; set; }
        public string Message { get; set; } = string.Empty;
        public ExchangeOfferStatus Status { get; set; } = ExchangeOfferStatus.Pending;

        public virtual ExchangeProduct Product { get; set; } = null!;
        public virtual User Sender { get; set; } = null!;
    }
}
