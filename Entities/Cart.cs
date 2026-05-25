using TerraVision.Api.Entities.Common;

namespace TerraVision.Api.Entities
{
    public class Cart : BaseEntity
    {
        public int UserId { get; set; }
        /// <summary>Last time the customer changed cart contents (add/update/remove).</summary>
        public DateTime? LastActivityAtUtc { get; set; }
        /// <summary>When the customer.cart.abandoned event was last published for the current activity window.</summary>
        public DateTime? AbandonedNotifiedAtUtc { get; set; }
        public virtual User User { get; set; } = null!;
        public virtual ICollection<CartItem> Items { get; set; } = new HashSet<CartItem>();
    }
}
