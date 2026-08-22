using TerraVision.Api.Entities.Common;

namespace TerraVision.Api.Entities
{
    public class ChatProposalLine : BaseEntity
    {
        public int ChatMessageId { get; set; }
        public virtual ChatMessage ChatMessage { get; set; } = null!;

        public int ProductId { get; set; }
        public virtual Product Product { get; set; } = null!;

        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string ProductName { get; set; } = string.Empty;
    }
}
