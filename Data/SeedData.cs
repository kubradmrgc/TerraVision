using Microsoft.EntityFrameworkCore;
using System.Text;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Data
{
    public static class SeedData
    {
        public static void ApplyConfiguration(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "İç Mekan Bitkileri", IsActive = true, IsDeleted = false, CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Category { Id = 2, Name = "Dış Mekan Bitkileri", IsActive = true, IsDeleted = false, CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Category { Id = 3, Name = "Saksılar ve Topraklar", IsActive = true, IsDeleted = false, CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Category { Id = 4, Name = "Bahçe Mobilyaları", IsActive = true, IsDeleted = false, CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );

            // Seed admin — bcrypt(workFactor 11) for password "admin123" (matches AuthService.Verify)
            var adminPasswordHash =
                Encoding.UTF8.GetBytes("$2a$11$kQsHod4IMJ9h4sOxi2Nt.uofrxLaFz.f8ABxwJFo3.SvY1ngpGmwG");

            modelBuilder.Entity<User>().HasData(
                new User 
                { 
                    Id = 1, 
                    FirstName = "Admin", 
                    LastName = "User", 
                    Email = "admin@terravision.com", 
                    PasswordHash = adminPasswordHash,
                    PasswordSalt = Array.Empty<byte>(),
                    Role = UserRole.Admin,
                    IsActive = true, 
                    IsDeleted = false, 
                    CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) 
                },
                new User
                {
                    Id = 2,
                    FirstName = "Demo",
                    LastName = "Customer",
                    Email = "customer@terravision.com",
                    PasswordHash = Encoding.UTF8.GetBytes("$2a$11$LXAiIikolyu25wuU7VFIb.o/QHItfLKu9Vj4Gjjbvdmsl3qnAo456"),
                    PasswordSalt = Array.Empty<byte>(),
                    Role = UserRole.Customer,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new User
                {
                    Id = 3,
                    FirstName = "Demo",
                    LastName = "Consultant",
                    Email = "consultant@terravision.com",
                    PasswordHash = Encoding.UTF8.GetBytes("$2a$11$yVosCupKynNPZpg2Eq2XBuwPtgX0xdtJ8vEMDyqq9cCI9ZEzyqwp."),
                    PasswordSalt = Array.Empty<byte>(),
                    Role = UserRole.Consultant,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            modelBuilder.Entity<Product>().HasData(
                new Product
                {
                    Id = 1,
                    Name = "Monstera Deliciosa",
                    Description = "İç mekan için popüler, geniş yapraklı dekoratif bitki.",
                    Price = 1299.00m,
                    StockQuantity = 12,
                    MinStockLevel = 3,
                    SKU = "PLT-MON-001",
                    ImageUrl = "/assets/product-images/monstera-deliciosa.jpg",
                    IsArCompatible = true,
                    CategoryId = 1,
                    WateringIntervalDays = 7,
                    FertilizingIntervalDays = 30,
                    CleaningIntervalDays = 14,
                    CareInstructions = "Toprak yüzeyi kuruyunca sulayın; doğrudan güneşten kaçının.",
                    CompareAtPrice = 1599.00m,
                    IsFeatured = true,
                    PromoLabel = "Fırsat",
                    PromoSortOrder = 1,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = seedDate
                },
                new Product
                {
                    Id = 2,
                    Name = "Fiddle Leaf Fig",
                    Description = "Modern salonlar için ikonik kauçuk ağacı türü.",
                    Price = 1899.50m,
                    StockQuantity = 8,
                    MinStockLevel = 2,
                    SKU = "PLT-FIC-002",
                    ImageUrl = "/assets/product-images/fiddle-leaf-fig.jpg",
                    IsArCompatible = false,
                    CategoryId = 1,
                    WateringIntervalDays = 10,
                    FertilizingIntervalDays = 45,
                    CleaningIntervalDays = 21,
                    CareInstructions = "Yaprakları nemli bezle silin; kışın sulamayı seyreltin.",
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = seedDate
                },
                new Product
                {
                    Id = 3,
                    Name = "Lavanta Saksısı",
                    Description = "Balkon ve bahçe için kokulu lavanta bitkisi.",
                    Price = 349.90m,
                    StockQuantity = 25,
                    MinStockLevel = 5,
                    SKU = "PLT-LAV-003",
                    ImageUrl = "/assets/product-images/lavender-pot.jpg",
                    IsArCompatible = false,
                    CategoryId = 2,
                    WateringIntervalDays = 5,
                    FertilizingIntervalDays = 21,
                    CleaningIntervalDays = null,
                    CareInstructions = "Tam güneşte yetiştirin; çiçeklenme sonrası hafif budama yapın.",
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = seedDate
                },
                new Product
                {
                    Id = 4,
                    Name = "Atatürk Çiçeği",
                    Description = "Dekoratif çiçekli saksı bitkisi; iç mekan ve balkon için uygundur.",
                    Price = 800.00m,
                    StockQuantity = 15,
                    MinStockLevel = 3,
                    SKU = "PLT-ATK-004",
                    ImageUrl = "/assets/product-images/lavender-pot.jpg",
                    IsArCompatible = false,
                    CategoryId = 1,
                    WateringIntervalDays = 7,
                    FertilizingIntervalDays = 30,
                    CleaningIntervalDays = 14,
                    CareInstructions = "Toprağı nemli tutun; direkt güneşten kaçının; çiçekler solunca solmuş kısımları temizleyin.",
                    CompareAtPrice = 999.00m,
                    IsFeatured = true,
                    PromoLabel = "%20",
                    PromoSortOrder = 0,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = seedDate
                }
            );

            modelBuilder.Entity<StoreCampaign>().HasData(
                new StoreCampaign
                {
                    Id = 1,
                    Title = "Bahar Kampanyası",
                    Subtitle = "Seçili bitkilerde indirim — sınırlı süre",
                    BadgeText = "KAMPANYA",
                    SortOrder = 0,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = seedDate
                }
            );

            modelBuilder.Entity<StoreCampaignProduct>().HasData(
                new StoreCampaignProduct { CampaignId = 1, ProductId = 4, SortOrder = 0 },
                new StoreCampaignProduct { CampaignId = 1, ProductId = 1, SortOrder = 1 },
                new StoreCampaignProduct { CampaignId = 1, ProductId = 3, SortOrder = 2 }
            );
        }
    }
}
