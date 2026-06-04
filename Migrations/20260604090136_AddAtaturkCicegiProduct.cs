using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAtaturkCicegiProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF NOT EXISTS (SELECT 1 FROM [Products] WHERE [Name] = N'Atatürk Çiçeği' AND [IsDeleted] = 0)
                BEGIN
                    INSERT INTO [Products] (
                        [Name], [Description], [Price], [StockQuantity], [MinStockLevel], [SKU],
                        [ImageUrl], [IsArCompatible], [CategoryId], [WateringIntervalDays],
                        [FertilizingIntervalDays], [CleaningIntervalDays], [CareInstructions],
                        [IsActive], [IsDeleted], [CreatedDate]
                    )
                    VALUES (
                        N'Atatürk Çiçeği',
                        N'Dekoratif çiçekli saksı bitkisi; iç mekan ve balkon için uygundur.',
                        800.00, 15, 3, N'PLT-ATK-004',
                        N'/assets/product-images/lavender-pot.jpg', 0, 1, 7, 30, 14,
                        N'Toprağı nemli tutun; direkt güneşten kaçının; çiçekler solunca solmuş kısımları temizleyin.',
                        1, 0, '2026-01-01T00:00:00.0000000Z'
                    );
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM [Products] WHERE [Name] = N'Atatürk Çiçeği' AND [SKU] = N'PLT-ATK-004';
                """);
        }
    }
}
