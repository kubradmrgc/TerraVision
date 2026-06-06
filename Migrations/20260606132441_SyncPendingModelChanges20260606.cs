using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncPendingModelChanges20260606 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                column: "ArModelFileName",
                value: "temp-smoke-eb98662c3ab549debb9e40237494adc3.gltf");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                column: "ArModelFileName",
                value: null);
        }
    }
}
