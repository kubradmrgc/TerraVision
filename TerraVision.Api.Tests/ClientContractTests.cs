using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TerraVision.Api.Enums;
using Xunit;

namespace TerraVision.Api.Tests;

/// <summary>
/// API JSON shapes consumed by web-nextjs and mobile-react-native (see clients/shared).
/// </summary>
public class ClientContractTests : IClassFixture<TerraVisionApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _client;

    public ClientContractTests(TerraVisionApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Products_ReturnsArray_WithClientContractFields()
    {
        var response = await _client.GetAsync("/api/Products");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        if (doc.RootElement.GetArrayLength() == 0)
            return;

        var first = doc.RootElement[0];
        foreach (var key in new[] { "id", "name", "description", "price", "stockQuantity", "minStockLevel", "sku", "imageUrl", "isArCompatible", "categoryId" })
        {
            Assert.True(first.TryGetProperty(key, out _), $"ProductDto missing '{key}'");
        }
    }

    [Fact]
    public async Task RegisterAndLogin_ReturnsAuthResponseShape()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var email = $"contract_{suffix}@t.test";

        _client.DefaultRequestHeaders.Authorization = null;
        var register = await _client.PostAsJsonAsync("/api/Auth/register", new
        {
            firstName = "Contract",
            lastName = "Test",
            email,
            password = "TestPwd!1",
            role = (int)UserRole.Customer
        });
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);

        var registerJson = await register.Content.ReadAsStringAsync();
        using var registerDoc = JsonDocument.Parse(registerJson);
        var root = registerDoc.RootElement;
        foreach (var key in new[] { "token", "refreshToken", "accessTokenExpiresAtUtc", "refreshTokenExpiresAtUtc", "userId", "firstName", "lastName", "email", "role" })
        {
            Assert.True(root.TryGetProperty(key, out _), $"AuthResponse missing '{key}'");
        }

        var login = await _client.PostAsJsonAsync("/api/Auth/login", new { email, password = "TestPwd!1" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    [Fact]
    public async Task CartAndOrders_AfterRegister_MatchClientCartContract()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var email = $"cart_{suffix}@t.test";

        _client.DefaultRequestHeaders.Authorization = null;
        var register = await _client.PostAsJsonAsync("/api/Auth/register", new
        {
            firstName = "Cart",
            lastName = "Contract",
            email,
            password = "TestPwd!1",
            role = (int)UserRole.Customer
        });
        register.EnsureSuccessStatusCode();
        var auth = await register.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        Assert.NotNull(auth?.Token);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        var cartResponse = await _client.GetAsync("/api/cart/me");
        Assert.Equal(HttpStatusCode.OK, cartResponse.StatusCode);
        var cartJson = await cartResponse.Content.ReadAsStringAsync();
        using var cartDoc = JsonDocument.Parse(cartJson);
        foreach (var key in new[] { "cartId", "userId", "totalAmount", "items" })
        {
            Assert.True(cartDoc.RootElement.TryGetProperty(key, out _), $"CartDto missing '{key}'");
        }

        var ordersResponse = await _client.GetAsync("/api/orders/me");
        Assert.Equal(HttpStatusCode.OK, ordersResponse.StatusCode);
        var ordersJson = await ordersResponse.Content.ReadAsStringAsync();
        using var ordersDoc = JsonDocument.Parse(ordersJson);
        Assert.Equal(JsonValueKind.Array, ordersDoc.RootElement.ValueKind);
    }

    private sealed class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
    }
}
