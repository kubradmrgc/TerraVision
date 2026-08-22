using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncStoreCampaignsPending : Migration
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

            migrationBuilder.AddColumn<DateTime>(
                name: "PromoEndsAtUtc",
                table: "Products",
                type: "datetime2",
                nullable: true);

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
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
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

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CompareAtPrice", "IsFeatured", "PromoEndsAtUtc", "PromoLabel", "PromoSortOrder", "PromoStartsAtUtc" },
                values: new object[] { 1599.00m, true, null, "Fırsat", 1, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CompareAtPrice", "IsFeatured", "PromoEndsAtUtc", "PromoLabel", "PromoSortOrder", "PromoStartsAtUtc" },
                values: new object[] { null, false, null, null, 0, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CompareAtPrice", "IsFeatured", "PromoEndsAtUtc", "PromoLabel", "PromoSortOrder", "PromoStartsAtUtc" },
                values: new object[] { null, false, null, null, 0, null });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CompareAtPrice", "IsFeatured", "PromoEndsAtUtc", "PromoLabel", "PromoSortOrder", "PromoStartsAtUtc" },
                values: new object[] { 999.00m, true, null, "%20", 0, null });

            migrationBuilder.InsertData(
                table: "StoreCampaigns",
                columns: new[] { "Id", "BadgeText", "CreatedDate", "EndsAtUtc", "IsActive", "IsDeleted", "SortOrder", "StartsAtUtc", "Subtitle", "Title", "UpdatedDate" },
                values: new object[] { 1, "KAMPANYA", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, false, 0, null, "Seçili bitkilerde indirim — sınırlı süre", "Bahar Kampanyası", null });

            migrationBuilder.InsertData(
                table: "StoreCampaignProducts",
                columns: new[] { "CampaignId", "ProductId", "SortOrder" },
                values: new object[,]
                {
                    { 1, 1, 1 },
                    { 1, 3, 2 },
                    { 1, 4, 0 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_StoreCampaignProducts_ProductId",
                table: "StoreCampaignProducts",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StoreCampaignProducts");

            migrationBuilder.DropTable(
                name: "StoreCampaigns");

            migrationBuilder.DropColumn(
                name: "CompareAtPrice",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PromoEndsAtUtc",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PromoLabel",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PromoSortOrder",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PromoStartsAtUtc",
                table: "Products");
        }
    }
}
