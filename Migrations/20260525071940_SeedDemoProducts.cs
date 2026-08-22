using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedDemoProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "ArModelFileName", "CategoryId", "CreatedDate", "Description", "ImageUrl", "IsActive", "IsArCompatible", "IsDeleted", "Name", "Price", "SKU", "StockQuantity", "UpdatedDate" },
                values: new object[,]
                {
                    { 1, null, 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "İç mekan için popüler, geniş yapraklı dekoratif bitki.", "/assets/product-images/monstera-deliciosa.jpg", true, true, false, "Monstera Deliciosa", 1299.00m, "PLT-MON-001", 12, null },
                    { 2, null, 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Modern salonlar için ikonik kauçuk ağacı türü.", "/assets/product-images/fiddle-leaf-fig.jpg", true, false, false, "Fiddle Leaf Fig", 1899.50m, "PLT-FIC-002", 8, null },
                    { 3, null, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Balkon ve bahçe için kokulu lavanta bitkisi.", "/assets/product-images/lavender-pot.jpg", true, false, false, "Lavanta Saksısı", 349.90m, "PLT-LAV-003", 25, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}
