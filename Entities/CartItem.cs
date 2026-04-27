using TerraVision.Api.Entities.Common;

namespace TerraVision.Api.Entities
{
    public class CartItem : BaseEntity
    {
        public int CartId { get; set; }
        public virtual Cart Cart { get; set; } = null!;
        public int ProductId { get; set; }
        public virtual Product Product { get; set; } = null!;
        public int Quantity { get; set; }
    }
}
