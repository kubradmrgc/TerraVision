using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class ApplyCartAbandonmentColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AbandonedNotifiedAtUtc",
                table: "Carts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivityAtUtc",
                table: "Carts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE c
                SET LastActivityAtUtc = agg.LastItemActivity
                FROM Carts c
                INNER JOIN (
                    SELECT ci.CartId,
                           MAX(COALESCE(ci.UpdatedDate, ci.CreatedDate)) AS LastItemActivity
                    FROM CartItems ci
                    WHERE ci.IsDeleted = 0
                    GROUP BY ci.CartId
                ) agg ON agg.CartId = c.Id
                WHERE c.IsDeleted = 0;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AbandonedNotifiedAtUtc",
                table: "Carts");

            migrationBuilder.DropColumn(
                name: "LastActivityAtUtc",
                table: "Carts");
        }
    }
}
