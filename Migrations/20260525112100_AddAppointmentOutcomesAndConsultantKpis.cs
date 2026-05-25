using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentOutcomesAndConsultantKpis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MinStockLevel",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LinkedOrderId",
                table: "Appointments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Outcome",
                table: "Appointments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "OutcomeNotes",
                table: "Appointments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OutcomeRecordedAt",
                table: "Appointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OutcomeRecordedByUserId",
                table: "Appointments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SatisfactionScore",
                table: "Appointments",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                column: "MinStockLevel",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                column: "MinStockLevel",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                column: "MinStockLevel",
                value: 5);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_LinkedOrderId",
                table: "Appointments",
                column: "LinkedOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_Orders_LinkedOrderId",
                table: "Appointments",
                column: "LinkedOrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_Orders_LinkedOrderId",
                table: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_LinkedOrderId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "MinStockLevel",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "LinkedOrderId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "Outcome",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "OutcomeNotes",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "OutcomeRecordedAt",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "OutcomeRecordedByUserId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "SatisfactionScore",
                table: "Appointments");
        }
    }
}
