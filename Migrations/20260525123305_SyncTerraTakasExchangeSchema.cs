using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncTerraTakasExchangeSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExchangeProducts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OwnerId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Condition = table.Column<int>(type: "int", nullable: false),
                    PhotoUrlsJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExchangeProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExchangeProducts_Users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ExchangeOffers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    SenderId = table.Column<int>(type: "int", nullable: false),
                    OfferType = table.Column<int>(type: "int", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExchangeOffers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExchangeOffers_ExchangeProducts_ProductId",
                        column: x => x.ProductId,
                        principalTable: "ExchangeProducts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExchangeOffers_Users_SenderId",
                        column: x => x.SenderId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeOffers_ProductId_Status_IsDeleted",
                table: "ExchangeOffers",
                columns: new[] { "ProductId", "Status", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeOffers_SenderId",
                table: "ExchangeOffers",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeProducts_OwnerId",
                table: "ExchangeProducts",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_ExchangeProducts_Status_IsActive_IsDeleted_CreatedDate",
                table: "ExchangeProducts",
                columns: new[] { "Status", "IsActive", "IsDeleted", "CreatedDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExchangeOffers");

            migrationBuilder.DropTable(
                name: "ExchangeProducts");
        }
    }
}
