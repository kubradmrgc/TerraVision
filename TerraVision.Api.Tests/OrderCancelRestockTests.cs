using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;
using Xunit;

namespace TerraVision.Api.Tests;

public class OrderCancelRestockTests : IClassFixture<TerraVisionApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly TerraVisionApiFactory _factory;
    private readonly HttpClient _client;

    public OrderCancelRestockTests(TerraVisionApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CancelOrder_RestoresProductStock()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var customer = await TestAuth.CreateUserAsync(_factory, _client, $"ord_cust_{suffix}@t.test", UserRole.Customer);
        var admin = await TestAuth.CreateUserAsync(_factory, _client, $"ord_admin_{suffix}@t.test", UserRole.Admin);
        var productId = await CreateProductAsync(admin.Token, stockQuantity: 5);

        SetBearer(customer.Token);
        var add = await _client.PostAsJsonAsync("/api/cart/items", new { productId, quantity = 2 });
        Assert.Equal(HttpStatusCode.OK, add.StatusCode);

        var checkout = await _client.PostAsJsonAsync("/api/orders/from-cart", new { notes = "restock-test" });
        Assert.Equal(HttpStatusCode.OK, checkout.StatusCode);
        var order = await checkout.Content.ReadFromJsonAsync<OrderDto>(JsonOptions);
        Assert.NotNull(order);

        var afterCheckout = await GetProductAsync(productId);
        Assert.Equal(3, afterCheckout.StockQuantity);

        SetBearer(admin.Token);
        var cancel = await _client.PatchAsJsonAsync(
            $"/api/orders/{order!.Id}/status",
            new { status = (int)OrderStatus.Cancelled, reason = "customer requested cancel" });
        Assert.Equal(HttpStatusCode.OK, cancel.StatusCode);

        var afterCancel = await GetProductAsync(productId);
        Assert.Equal(5, afterCancel.StockQuantity);
    }

    private async Task<int> CreateProductAsync(string adminToken, int stockQuantity)
    {
        SetBearer(adminToken);
        var categoryResponse = await _client.PostAsJsonAsync("/api/categories", new { name = $"Cat {Guid.NewGuid():N}"[..12] });
        categoryResponse.EnsureSuccessStatusCode();
        var category = await categoryResponse.Content.ReadFromJsonAsync<CategoryDto>(JsonOptions);

        var response = await _client.PostAsJsonAsync("/api/products", new
        {
            name = $"Restock {Guid.NewGuid():N}"[..16],
            description = "Cancel restock test product",
            price = 10m,
            stockQuantity,
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

    private async Task<ProductDto> GetProductAsync(int productId)
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync($"/api/products/{productId}");
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ProductDto>(JsonOptions))!;
    }

    private void SetBearer(string token) =>
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    private sealed class CategoryDto
    {
        public int Id { get; set; }
    }
}
