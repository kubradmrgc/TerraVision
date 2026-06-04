using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;
using Xunit;

namespace TerraVision.Api.Tests;

public class AdminUsersTests : IClassFixture<TerraVisionApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly HttpClient _client;

    public AdminUsersTests(TerraVisionApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetUsers_AsAdmin_ReturnsPagedUsers()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var adminToken = await RegisterAsync($"admin_users_{suffix}@t.test", UserRole.Admin);
        await RegisterAsync($"cust_users_{suffix}@t.test", UserRole.Customer);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var response = await _client.GetAsync("/api/users?page=1&pageSize=50");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<PagedResult<AdminUserDto>>(JsonOptions);
        Assert.NotNull(body);
        Assert.True(body!.TotalCount >= 2);
        Assert.Contains(body.Items, u => u.Email.Contains($"cust_users_{suffix}@t.test", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(body.Items, u => u.Email.Contains("Password", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GetUsers_AsCustomer_ReturnsForbidden()
    {
        var token = await RegisterAsync($"cust_only_{Guid.NewGuid():N}"[..24] + "@t.test", UserRole.Customer);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/users");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task<string> RegisterAsync(string email, UserRole role)
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.PostAsJsonAsync("/api/Auth/register", new
        {
            firstName = "Test",
            lastName = "User",
            email,
            password = "TestPwd!1",
            role = (int)role
        });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        return body!.Token;
    }

    private sealed class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
    }
}
