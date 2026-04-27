using TerraVision.Api.Entities.Common;

namespace TerraVision.Api.Entities
{
    public class Cart : BaseEntity
    {
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;
        public virtual ICollection<CartItem> Items { get; set; } = new HashSet<CartItem>();
    }
}
