using TerraVision.Api.Entities.Common;

namespace TerraVision.Api.Entities
{
    public class Category : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        
        public int? ParentCategoryId { get; set; }
        public virtual Category? ParentCategory { get; set; }
        
        public virtual ICollection<Category> SubCategories { get; set; } = new HashSet<Category>();
        public virtual ICollection<Product> Products { get; set; } = new HashSet<Product>();
    }
}