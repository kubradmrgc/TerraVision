using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;
using Xunit;

namespace TerraVision.Api.Tests;

public class CartServiceTests : IClassFixture<TerraVisionApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly HttpClient _client;

    public CartServiceTests(TerraVisionApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AddItem_AfterSoftDelete_RevivesRowInsteadOf500()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var customerToken = await RegisterAsync($"cart_cust_{suffix}@t.test", UserRole.Customer);
        var adminToken = await RegisterAsync($"cart_admin_{suffix}@t.test", UserRole.Admin);
        var productId = await CreateProductAsync(adminToken);

        SetBearer(customerToken);
        var add1 = await _client.PostAsJsonAsync("/api/cart/items", new { productId, quantity = 1 });
        Assert.Equal(HttpStatusCode.OK, add1.StatusCode);

        var remove = await _client.DeleteAsync($"/api/cart/items/{productId}");
        Assert.Equal(HttpStatusCode.OK, remove.StatusCode);

        var add2 = await _client.PostAsJsonAsync("/api/cart/items", new { productId, quantity = 2 });
        Assert.Equal(HttpStatusCode.OK, add2.StatusCode);

        var cart = await add2.Content.ReadFromJsonAsync<CartDto>(JsonOptions);
        Assert.NotNull(cart);
        var line = Assert.Single(cart!.Items);
        Assert.Equal(productId, line.ProductId);
        Assert.Equal(2, line.Quantity);
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
        Assert.NotNull(body?.Token);
        return body!.Token;
    }

    private async Task<int> CreateProductAsync(string adminToken)
    {
        SetBearer(adminToken);
        var categoryResponse = await _client.PostAsJsonAsync("/api/categories", new { name = $"Cat {Guid.NewGuid():N}"[..12] });
        categoryResponse.EnsureSuccessStatusCode();
        var category = await categoryResponse.Content.ReadFromJsonAsync<CategoryDto>(JsonOptions);

        var response = await _client.PostAsJsonAsync("/api/products", new
        {
            name = $"Cart Test {Guid.NewGuid():N}"[..16],
            description = "Cart test product",
            price = 10m,
            stockQuantity = 50,
            minStockLevel = 1,
            sku = $"SKU-{Guid.NewGuid():N}"[..12],
            imageUrl = "/assets/product-images/monstera-deliciosa.jpg",
            isArCompatible = false,
            categoryId = category!.Id
        });
        response.EnsureSuccessStatusCode();
        var product = await response.Content.ReadFromJsonAsync<ProductDto>(JsonOptions);
        return product!.Id;
    }

    private void SetBearer(string token) =>
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    private sealed class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
    }
}
