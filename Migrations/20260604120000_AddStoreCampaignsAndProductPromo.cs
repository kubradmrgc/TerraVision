using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreCampaignsAndProductPromo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CompareAtPrice",
                table: "Products",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PromoLabel",
                table: "Products",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PromoSortOrder",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "PromoStartsAtUtc",
                table: "Products",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PromoEndsAtUtc",
                table: "Products",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StoreCampaigns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Subtitle = table.Column<string>(type: "nvarchar(240)", maxLength: 240, nullable: true),
                    BadgeText = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    StartsAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndsAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedByUserId = table.Column<int>(type: "int", nullable: true),
                    UpdatedReason = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreCampaigns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StoreCampaignProducts",
                columns: table => new
                {
                    CampaignId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreCampaignProducts", x => new { x.CampaignId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_StoreCampaignProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StoreCampaignProducts_StoreCampaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "StoreCampaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StoreCampaignProducts_ProductId",
                table: "StoreCampaignProducts",
                column: "ProductId");

            migrationBuilder.Sql(
                """
                UPDATE [Products] SET [CompareAtPrice] = 1599.00, [IsFeatured] = 1, [PromoLabel] = N'Fırsat', [PromoSortOrder] = 1 WHERE [Id] = 1;
                UPDATE [Products] SET [CompareAtPrice] = 999.00, [IsFeatured] = 1, [PromoLabel] = N'%20', [PromoSortOrder] = 0 WHERE [Id] = 4;
                IF NOT EXISTS (SELECT 1 FROM [StoreCampaigns] WHERE [Id] = 1)
                BEGIN
                    SET IDENTITY_INSERT [StoreCampaigns] ON;
                    INSERT INTO [StoreCampaigns] ([Id],[Title],[Subtitle],[BadgeText],[SortOrder],[StartsAtUtc],[EndsAtUtc],[IsActive],[IsDeleted],[CreatedDate])
                    VALUES (1, N'Bahar Kampanyası', N'Seçili bitkilerde indirim — sınırlı süre', N'KAMPANYA', 0, NULL, NULL, 1, 0, '2026-01-01T00:00:00.0000000Z');
                    SET IDENTITY_INSERT [StoreCampaigns] OFF;
                END
                IF NOT EXISTS (SELECT 1 FROM [StoreCampaignProducts] WHERE [CampaignId] = 1 AND [ProductId] = 4)
                    INSERT INTO [StoreCampaignProducts] ([CampaignId],[ProductId],[SortOrder]) VALUES (1, 4, 0), (1, 1, 1), (1, 3, 2);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "StoreCampaignProducts");
            migrationBuilder.DropTable(name: "StoreCampaigns");
            migrationBuilder.DropColumn(name: "CompareAtPrice", table: "Products");
            migrationBuilder.DropColumn(name: "IsFeatured", table: "Products");
            migrationBuilder.DropColumn(name: "PromoLabel", table: "Products");
            migrationBuilder.DropColumn(name: "PromoSortOrder", table: "Products");
            migrationBuilder.DropColumn(name: "PromoStartsAtUtc", table: "Products");
            migrationBuilder.DropColumn(name: "PromoEndsAtUtc", table: "Products");
        }
    }
}
