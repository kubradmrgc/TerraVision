using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSiteSupportFooter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SiteContactChannels",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChannelKey = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Label = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteContactChannels", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SiteFeedbackSubmissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    UserStory = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Kind = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    PageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteFeedbackSubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteFeedbackSubmissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "SiteContactChannels",
                columns: new[] { "Id", "ChannelKey", "CreatedDate", "Email", "IsActive", "IsDeleted", "Label", "SortOrder", "UpdatedDate" },
                values: new object[,]
                {
                    { 1, "support", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "destek@terravision.com", true, false, "Teknik destek", 0, null },
                    { 2, "contact", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "iletisim@terravision.com", true, false, "Genel iletişim", 1, null },
                    { 3, "info", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "bilgi@terravision.com", true, false, "Kurumsal", 2, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_SiteContactChannels_ChannelKey",
                table: "SiteContactChannels",
                column: "ChannelKey",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_SiteFeedbackSubmissions_Status_IsDeleted_CreatedDate",
                table: "SiteFeedbackSubmissions",
                columns: new[] { "Status", "IsDeleted", "CreatedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_SiteFeedbackSubmissions_UserId",
                table: "SiteFeedbackSubmissions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SiteContactChannels");

            migrationBuilder.DropTable(
                name: "SiteFeedbackSubmissions");
        }
    }
}
