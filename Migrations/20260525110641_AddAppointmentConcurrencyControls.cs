using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentConcurrencyControls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_ConsultantId",
                table: "Appointments");

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Appointments",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ConsultantId_AppointmentDate",
                table: "Appointments",
                columns: new[] { "ConsultantId", "AppointmentDate" },
                unique: true,
                filter: "[Status] <> 4 AND [IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Appointments_ConsultantId_AppointmentDate",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Appointments");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ConsultantId",
                table: "Appointments",
                column: "ConsultantId");
        }
    }
}
