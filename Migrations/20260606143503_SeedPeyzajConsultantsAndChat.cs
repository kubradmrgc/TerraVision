using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TerraVision.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedPeyzajConsultantsAndChat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent seed: veritabanında danışmanlar zaten varsa atla.
            migrationBuilder.Sql("""
                DECLARE @pwd varbinary(60) = 0x2432612431312479566F734375704B796E4E505A7067324571325842757750746758307864744A3876454D4479717139634349395A457A797177702E;
                DECLARE @seed datetime2 = '2026-01-01T00:00:00.0000000Z';

                IF NOT EXISTS (SELECT 1 FROM [Users] WHERE [Id] = 4)
                BEGIN
                    SET IDENTITY_INSERT [Users] ON;
                    INSERT INTO [Users] ([Id],[CreatedDate],[Email],[FirstName],[IsActive],[IsDeleted],[LastName],[PasswordHash],[PasswordSalt],[RefreshToken],[RefreshTokenExpiresAtUtc],[Role],[UpdatedDate])
                    VALUES (4, @seed, N'danisman.ali@terravision.com', N'danışmanAli', 1, 0, N'', @pwd, 0x, NULL, NULL, 2, NULL);
                    SET IDENTITY_INSERT [Users] OFF;
                END

                IF NOT EXISTS (SELECT 1 FROM [Users] WHERE [Id] = 5)
                BEGIN
                    SET IDENTITY_INSERT [Users] ON;
                    INSERT INTO [Users] ([Id],[CreatedDate],[Email],[FirstName],[IsActive],[IsDeleted],[LastName],[PasswordHash],[PasswordSalt],[RefreshToken],[RefreshTokenExpiresAtUtc],[Role],[UpdatedDate])
                    VALUES (5, @seed, N'danisman.ayse@terravision.com', N'danışmanAyşe', 1, 0, N'', @pwd, 0x, NULL, NULL, 2, NULL);
                    SET IDENTITY_INSERT [Users] OFF;
                END

                IF NOT EXISTS (SELECT 1 FROM [Users] WHERE [Id] = 6)
                BEGIN
                    SET IDENTITY_INSERT [Users] ON;
                    INSERT INTO [Users] ([Id],[CreatedDate],[Email],[FirstName],[IsActive],[IsDeleted],[LastName],[PasswordHash],[PasswordSalt],[RefreshToken],[RefreshTokenExpiresAtUtc],[Role],[UpdatedDate])
                    VALUES (6, @seed, N'danisman.selin@terravision.com', N'danışmanSelin', 1, 0, N'', @pwd, 0x, NULL, NULL, 2, NULL);
                    SET IDENTITY_INSERT [Users] OFF;
                END

                IF NOT EXISTS (SELECT 1 FROM [ConsultationSessions] WHERE [Id] = 1)
                BEGIN
                    SET IDENTITY_INSERT [ConsultationSessions] ON;
                    INSERT INTO [ConsultationSessions] ([Id],[AppointmentId],[ConsultantId],[CreatedDate],[CustomerId],[IsActive],[IsDeleted],[Status],[Title],[UpdatedDate])
                    VALUES (1, NULL, 4, @seed, 2, 1, 0, 1, N'Peyzaj planı — danışmanAli', NULL);
                    SET IDENTITY_INSERT [ConsultationSessions] OFF;
                END

                IF NOT EXISTS (SELECT 1 FROM [ConsultationSessions] WHERE [Id] = 2)
                BEGIN
                    SET IDENTITY_INSERT [ConsultationSessions] ON;
                    INSERT INTO [ConsultationSessions] ([Id],[AppointmentId],[ConsultantId],[CreatedDate],[CustomerId],[IsActive],[IsDeleted],[Status],[Title],[UpdatedDate])
                    VALUES (2, NULL, 5, @seed, 2, 1, 0, 1, N'Peyzaj planı — danışmanAyşe', NULL);
                    SET IDENTITY_INSERT [ConsultationSessions] OFF;
                END

                IF NOT EXISTS (SELECT 1 FROM [ConsultationSessions] WHERE [Id] = 3)
                BEGIN
                    SET IDENTITY_INSERT [ConsultationSessions] ON;
                    INSERT INTO [ConsultationSessions] ([Id],[AppointmentId],[ConsultantId],[CreatedDate],[CustomerId],[IsActive],[IsDeleted],[Status],[Title],[UpdatedDate])
                    VALUES (3, NULL, 6, @seed, 2, 1, 0, 1, N'Peyzaj planı — danışmanSelin', NULL);
                    SET IDENTITY_INSERT [ConsultationSessions] OFF;
                END

                IF NOT EXISTS (SELECT 1 FROM [ChatMessages] WHERE [Id] = 1)
                BEGIN
                    SET IDENTITY_INSERT [ChatMessages] ON;
                    INSERT INTO [ChatMessages] ([Id],[Content],[CreatedDate],[IsActive],[IsDeleted],[Kind],[ProposalNotes],[ProposalTitle],[SenderId],[SessionId],[UpdatedDate])
                    VALUES (1, N'Merhaba! Ben danışmanAli. Bahçe ve peyzaj planınız için buradayım — sorularınızı bekliyorum.', @seed, 1, 0, 1, NULL, NULL, 4, 1, NULL);
                    SET IDENTITY_INSERT [ChatMessages] OFF;
                END

                IF NOT EXISTS (SELECT 1 FROM [ChatMessages] WHERE [Id] = 2)
                BEGIN
                    SET IDENTITY_INSERT [ChatMessages] ON;
                    INSERT INTO [ChatMessages] ([Id],[Content],[CreatedDate],[IsActive],[IsDeleted],[Kind],[ProposalNotes],[ProposalTitle],[SenderId],[SessionId],[UpdatedDate])
                    VALUES (2, N'Merhaba! Ben danışmanAyşe. İç ve dış mekân bitki seçimi için size yardımcı olabilirim.', @seed, 1, 0, 1, NULL, NULL, 5, 2, NULL);
                    SET IDENTITY_INSERT [ChatMessages] OFF;
                END

                IF NOT EXISTS (SELECT 1 FROM [ChatMessages] WHERE [Id] = 3)
                BEGIN
                    SET IDENTITY_INSERT [ChatMessages] ON;
                    INSERT INTO [ChatMessages] ([Id],[Content],[CreatedDate],[IsActive],[IsDeleted],[Kind],[ProposalNotes],[ProposalTitle],[SenderId],[SessionId],[UpdatedDate])
                    VALUES (3, N'Merhaba! Ben danışmanSelin. Balkon ve bahçe düzenleme teklifleri için yazabilirsiniz.', @seed, 1, 0, 1, NULL, NULL, 6, 3, NULL);
                    SET IDENTITY_INSERT [ChatMessages] OFF;
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ChatMessages",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "ChatMessages",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "ChatMessages",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "ConsultationSessions",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "ConsultationSessions",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "ConsultationSessions",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 6);
        }
    }
}
