using TerraVision.Api.Entities;

namespace TerraVision.Api.Services
{
    public static class ProductStockAlertEvaluator
    {
        public static bool ShouldNotify(int previousStock, int newStock, int minStockLevel) =>
            minStockLevel > 0
            && previousStock > minStockLevel
            && newStock <= minStockLevel;

        public static string BuildMessage(string productName, int stockQuantity, int minStockLevel) =>
            $"{productName} ürünü kritik stok seviyesinde! (Stok: {stockQuantity}, Eşik: {minStockLevel})";

        public static bool ShouldNotify(Product product, int previousStock) =>
            ShouldNotify(previousStock, product.StockQuantity, product.MinStockLevel);
    }
}
