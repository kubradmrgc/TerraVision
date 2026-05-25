using TerraVision.Api.Entities.Common;

namespace TerraVision.Api.Entities
{
    public class PlantCareCalendar : BaseEntity
    {
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public int ProductId { get; set; }
        public virtual Product Product { get; set; } = null!;

        public DateTime? NextWateringDueAt { get; set; }
        public DateTime? NextFertilizingDueAt { get; set; }
        public DateTime? NextCleaningDueAt { get; set; }

        public DateTime? LastWateredAt { get; set; }
        public DateTime? LastFertilizedAt { get; set; }
        public DateTime? LastCleanedAt { get; set; }

        public virtual ICollection<CareLog> CareLogs { get; set; } = new HashSet<CareLog>();
    }
}
