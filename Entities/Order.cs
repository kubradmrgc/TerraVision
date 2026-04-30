using TerraVision.Api.Entities.Common;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Entities
{
    public class Order : BaseEntity
    {
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public decimal TotalAmount { get; set; }
        public string? Notes { get; set; }
        public int? UpdatedByUserId { get; set; }
        public string? UpdatedReason { get; set; }
        public virtual ICollection<OrderItem> Items { get; set; } = new HashSet<OrderItem>();
        public virtual ICollection<OrderStatusHistory> StatusHistory { get; set; } = new HashSet<OrderStatusHistory>();
    }
}
