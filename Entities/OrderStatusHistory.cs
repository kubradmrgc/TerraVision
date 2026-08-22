using TerraVision.Api.Entities.Common;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Entities
{
    public class OrderStatusHistory : BaseEntity
    {
        public int OrderId { get; set; }
        public virtual Order Order { get; set; } = null!;
        public OrderStatus? PreviousStatus { get; set; }
        public OrderStatus NewStatus { get; set; }
        public int ChangedByUserId { get; set; }
        public string? Reason { get; set; }
    }
}
