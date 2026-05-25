using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncPendingModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CareInstructions",
                table: "Products",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CleaningIntervalDays",
                table: "Products",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FertilizingIntervalDays",
                table: "Products",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WateringIntervalDays",
                table: "Products",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PlantCareCalendars",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    NextWateringDueAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NextFertilizingDueAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NextCleaningDueAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastWateredAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastFertilizedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastCleanedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlantCareCalendars", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlantCareCalendars_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlantCareCalendars_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CareLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlantCareCalendarId = table.Column<int>(type: "int", nullable: false),
                    ActionType = table.Column<int>(type: "int", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CareLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CareLogs_PlantCareCalendars_PlantCareCalendarId",
                        column: x => x.PlantCareCalendarId,
                        principalTable: "PlantCareCalendars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CareInstructions", "CleaningIntervalDays", "FertilizingIntervalDays", "WateringIntervalDays" },
                values: new object[] { "Toprak yüzeyi kuruyunca sulayın; doğrudan güneşten kaçının.", 14, 30, 7 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CareInstructions", "CleaningIntervalDays", "FertilizingIntervalDays", "WateringIntervalDays" },
                values: new object[] { "Yaprakları nemli bezle silin; kışın sulamayı seyreltin.", 21, 45, 10 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CareInstructions", "CleaningIntervalDays", "FertilizingIntervalDays", "WateringIntervalDays" },
                values: new object[] { "Tam güneşte yetiştirin; çiçeklenme sonrası hafif budama yapın.", null, 21, 5 });

            migrationBuilder.CreateIndex(
                name: "IX_CareLogs_PlantCareCalendarId_CompletedAt",
                table: "CareLogs",
                columns: new[] { "PlantCareCalendarId", "CompletedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PlantCareCalendars_ProductId",
                table: "PlantCareCalendars",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantCareCalendars_UserId_ProductId",
                table: "PlantCareCalendars",
                columns: new[] { "UserId", "ProductId" },
                unique: true,
                filter: "[IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CareLogs");

            migrationBuilder.DropTable(
                name: "PlantCareCalendars");

            migrationBuilder.DropColumn(
                name: "CareInstructions",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "CleaningIntervalDays",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "FertilizingIntervalDays",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "WateringIntervalDays",
                table: "Products");
        }
    }
}
