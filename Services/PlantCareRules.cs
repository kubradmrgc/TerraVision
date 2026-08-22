using TerraVision.Api.Entities;

namespace TerraVision.Api.Services
{
    public static class PlantCareRules
    {
        /// <summary>İç ve dış mekan bitki kategorileri (SeedData Category Id 1–2).</summary>
        public static readonly HashSet<int> PlantCategoryIds = new() { 1, 2 };

        public const int UpcomingWindowDays = 3;

        public static bool IsPlantCategory(int categoryId) => PlantCategoryIds.Contains(categoryId);

        public static bool QualifiesForCareCalendar(Product product) =>
            HasCareSchedule(product) || IsPlantCategory(product.CategoryId);

        public static bool HasCareSchedule(Product product) =>
            product.WateringIntervalDays is > 0 ||
            product.FertilizingIntervalDays is > 0 ||
            product.CleaningIntervalDays is > 0;
    }
}
