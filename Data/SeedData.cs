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
                }
            );
        }
    }
}
