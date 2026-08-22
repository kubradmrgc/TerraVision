using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedCustomerConsultantUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedDate", "Email", "FirstName", "IsActive", "IsDeleted", "LastName", "PasswordHash", "PasswordSalt", "RefreshToken", "RefreshTokenExpiresAtUtc", "Role", "UpdatedDate" },
                values: new object[,]
                {
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "customer@terravision.com", "Demo", true, false, "Customer", new byte[] { 36, 50, 97, 36, 49, 49, 36, 76, 88, 65, 105, 73, 105, 107, 111, 108, 121, 117, 50, 53, 119, 117, 85, 55, 86, 70, 73, 98, 46, 111, 47, 81, 72, 73, 116, 102, 76, 75, 117, 57, 86, 106, 52, 71, 106, 106, 98, 118, 100, 109, 115, 108, 51, 113, 110, 65, 111, 52, 53, 54 }, new byte[0], null, null, 1, null },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "consultant@terravision.com", "Demo", true, false, "Consultant", new byte[] { 36, 50, 97, 36, 49, 49, 36, 121, 86, 111, 115, 67, 117, 112, 75, 121, 110, 78, 80, 90, 112, 103, 50, 69, 113, 50, 88, 66, 117, 119, 80, 116, 103, 88, 48, 120, 100, 116, 74, 56, 118, 69, 77, 68, 121, 113, 113, 57, 99, 67, 73, 57, 90, 69, 122, 121, 113, 119, 112, 46 }, new byte[0], null, null, 2, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}
