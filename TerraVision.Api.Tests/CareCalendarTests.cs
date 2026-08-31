using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;
using Xunit;

namespace TerraVision.Api.Tests;

public class CareCalendarTests : IClassFixture<TerraVisionApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly TerraVisionApiFactory _factory;
    private readonly HttpClient _client;

    public CareCalendarTests(TerraVisionApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task DeliveredOrder_ProvisionsUserProductCalendar_AndCompleteActionAdvancesDueDate()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var customer = await RegisterAsync($"care_cust_{suffix}@t.test", UserRole.Customer);
        var admin = await RegisterAsync($"care_admin_{suffix}@t.test", UserRole.Admin);

        var plant = await CreatePlantProductAsync(admin.Token);
        var order = await PlaceOrderForProductAsync(customer.Token, plant.Id);
        await AdvanceOrderToDeliveredAsync(admin.Token, order.Id);

        SetBearer(customer.Token);
        var calendarResponse = await _client.GetAsync("/api/care/my-calendar");
        Assert.Equal(HttpStatusCode.OK, calendarResponse.StatusCode);

        var calendar = await calendarResponse.Content.ReadFromJsonAsync<MyPlantCareCalendarResponse>(JsonOptions);
        Assert.NotNull(calendar);
        var entry = Assert.Single(calendar!.Plants);
        Assert.Equal(plant.Id, entry.ProductId);

        var watering = entry.Tasks.Single(t => t.ActionType == CareActionType.Watering);
        Assert.NotNull(watering.NextDueAt);
        var previousDue = watering.NextDueAt!.Value;

        var completeResponse = await _client.PostAsJsonAsync(
            $"/api/care/{entry.Id}/complete-action",
            new CompleteCareActionRequest { ActionType = CareActionType.Watering });
        Assert.Equal(HttpStatusCode.OK, completeResponse.StatusCode);

        var updated = await completeResponse.Content.ReadFromJsonAsync<PlantCareCalendarDto>(JsonOptions);
        Assert.NotNull(updated);
        var updatedWatering = updated!.Tasks.Single(t => t.ActionType == CareActionType.Watering);
        Assert.NotNull(updatedWatering.LastCompletedAt);
        Assert.True(updatedWatering.NextDueAt > previousDue);
    }

    private async Task<AuthContext> RegisterAsync(string email, UserRole role)
    {
        var created = await TestAuth.CreateUserAsync(_factory, _client, email, role);
        return new AuthContext(created.Token, created.UserId);
    }

    private void SetBearer(string token) =>
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    private async Task<ProductDto> CreatePlantProductAsync(string adminToken)
    {
        SetBearer(adminToken);
        var categoryResponse = await _client.PostAsJsonAsync("/api/categories", new { name = $"Bitki {Guid.NewGuid():N}"[..16] });
        categoryResponse.EnsureSuccessStatusCode();
        var category = await categoryResponse.Content.ReadFromJsonAsync<CategoryDto>(JsonOptions);

        var response = await _client.PostAsJsonAsync("/api/products", new
        {
            name = $"Care Plant {Guid.NewGuid():N}"[..20],
            description = "Test plant for care calendar",
            price = 99.9m,
            stockQuantity = 20,
            minStockLevel = 2,
            sku = $"CARE-{Guid.NewGuid():N}"[..12],
            imageUrl = "/assets/product-images/monstera-deliciosa.jpg",
            isArCompatible = false,
            categoryId = category!.Id,
            wateringIntervalDays = 7,
            fertilizingIntervalDays = 30,
            cleaningIntervalDays = 14,
            careInstructions = "Haftada bir sulayın."
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ProductDto>(JsonOptions))!;
    }

    private async Task<OrderDto> PlaceOrderForProductAsync(string customerToken, int productId)
    {
        SetBearer(customerToken);
        var addResponse = await _client.PostAsJsonAsync("/api/cart/items", new { productId, quantity = 1 });
        addResponse.EnsureSuccessStatusCode();
        var orderResponse = await _client.PostAsJsonAsync("/api/orders/from-cart", new { notes = "care-test" });
        orderResponse.EnsureSuccessStatusCode();
        return (await orderResponse.Content.ReadFromJsonAsync<OrderDto>(JsonOptions))!;
    }

    private async Task AdvanceOrderToDeliveredAsync(string adminToken, int orderId)
    {
        SetBearer(adminToken);
        foreach (var status in new[] { OrderStatus.Confirmed, OrderStatus.Shipped, OrderStatus.Delivered })
        {
            var response = await _client.PatchAsJsonAsync(
                $"/api/orders/{orderId}/status",
                new { status = (int)status, reason = (string?)null });
            response.EnsureSuccessStatusCode();
        }
    }

    private sealed record AuthContext(string Token, int UserId);

    private sealed class CategoryDto
    {
        public int Id { get; set; }
    }
}
