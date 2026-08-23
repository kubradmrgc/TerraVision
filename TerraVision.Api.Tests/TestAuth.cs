using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using TerraVision.Api.Data;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;

namespace TerraVision.Api.Tests;

internal static class TestAuth
{
    internal const string Password = "TestPwd!1";

    internal static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    internal static async Task<AuthContext> CreateUserAsync(
        TerraVisionApiFactory factory,
        HttpClient client,
        string email,
        UserRole role)
    {
        if (role == UserRole.Customer)
        {
            return await RegisterViaPublicApiAsync(client, email);
        }

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraVisionDbContext>();
        var jwt = scope.ServiceProvider.GetRequiredService<IJwtTokenGenerator>();
        var user = new User
        {
            FirstName = "Test",
            LastName = "User",
            Email = email,
            Role = role,
            PasswordHash = Encoding.UTF8.GetBytes(Password),
            PasswordSalt = Array.Empty<byte>(),
            IsActive = true,
            IsDeleted = false
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        return new AuthContext(jwt.GenerateToken(user), user.Id, user.Role);
    }

    internal static async Task<AuthContext> RegisterViaPublicApiAsync(HttpClient client, string email, UserRole requestedRole = UserRole.Customer)
    {
        client.DefaultRequestHeaders.Authorization = null;
        var response = await client.PostAsJsonAsync("/api/Auth/register", new
        {
            firstName = "Test",
            lastName = "User",
            email,
            password = Password,
            role = (int)requestedRole
        });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        if (body?.Token is null)
        {
            throw new InvalidOperationException("Registration did not return a token.");
        }

        return new AuthContext(body.Token, body.UserId, body.Role);
    }

    internal sealed record AuthContext(string Token, int UserId, UserRole Role);

    private sealed class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public int UserId { get; set; }
        public UserRole Role { get; set; }
    }
}
