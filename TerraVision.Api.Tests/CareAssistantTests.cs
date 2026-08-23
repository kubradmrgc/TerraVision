using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;
using TerraVision.Api.Services;
using Xunit;

namespace TerraVision.Api.Tests;

public class CareAssistantTests : IClassFixture<TerraVisionApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly TerraVisionApiFactory _factory;
    private readonly HttpClient _client;

    public CareAssistantTests(TerraVisionApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AssistantChat_ReturnsFallbackSummary_ForRegisteredPlant()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var customer = await RegisterAsync($"asst_cust_{suffix}@t.test", UserRole.Customer);
        var admin = await RegisterAsync($"asst_admin_{suffix}@t.test", UserRole.Admin);

        var plant = await CreatePlantProductAsync(admin.Token, "Monstera Asistan");
        var order = await PlaceOrderForProductAsync(customer.Token, plant.Id);
        await AdvanceOrderToDeliveredAsync(admin.Token, order.Id);

        SetBearer(customer.Token);
        var response = await _client.PostAsJsonAsync("/api/care/assistant/chat", new CareAssistantChatRequest
        {
            Message = "Takvim özetimi verir misin?"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<CareAssistantChatResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal("fallback", body!.Mode);
        Assert.Contains("Monstera Asistan", body.Reply);
        Assert.Equal(CareAssistantContextBuilder.Disclaimer, body.Disclaimer);
        Assert.Single(body.Plants);
    }

    [Fact]
    public async Task AssistantChat_EmptyMessage_ReturnsBadRequest()
    {
        var customer = await RegisterAsync($"asst_empty_{Guid.NewGuid():N}"[..20] + "@t.test", UserRole.Customer);
        SetBearer(customer.Token);

        var response = await _client.PostAsJsonAsync("/api/care/assistant/chat", new CareAssistantChatRequest
        {
            Message = "   "
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public void FallbackResponder_ListsOverdueTasks()
    {
        var calendar = new MyPlantCareCalendarResponse
        {
            Plants =
            [
                new PlantCareCalendarDto
                {
                    Id = 1,
                    ProductName = "Test Bitki",
                    OverallUrgency = CareTaskUrgency.Overdue,
                    Tasks =
                    [
                        new CareTaskDto
                        {
                            ActionType = CareActionType.Watering,
                            Urgency = CareTaskUrgency.Overdue,
                            NextDueAt = DateTime.UtcNow.AddDays(-2),
                            IntervalDays = 7,
                            IsActionEnabled = true
                        }
                    ]
                }
            ]
        };

        var reply = CareAssistantFallbackResponder.Generate("gecikmiş görevlerim var mı?", calendar);
        Assert.Contains("Gecikmiş", reply);
        Assert.Contains("Test Bitki", reply);
        Assert.Contains("Sulama", reply);
    }

    private async Task<AuthContext> RegisterAsync(string email, UserRole role)
    {
        var created = await TestAuth.CreateUserAsync(_factory, _client, email, role);
        return new AuthContext(created.Token, created.UserId);
    }

    private void SetBearer(string token) =>
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    private async Task<ProductDto> CreatePlantProductAsync(string adminToken, string name)
    {
        SetBearer(adminToken);
        var categoryResponse = await _client.PostAsJsonAsync("/api/categories", new { name = $"Bitki {Guid.NewGuid():N}"[..16] });
        categoryResponse.EnsureSuccessStatusCode();
        var category = await categoryResponse.Content.ReadFromJsonAsync<CategoryDto>(JsonOptions);

        var response = await _client.PostAsJsonAsync("/api/products", new
        {
            name,
            description = "Assistant test plant",
            price = 49.9m,
            stockQuantity = 10,
            minStockLevel = 1,
            sku = $"ASST-{Guid.NewGuid():N}"[..12],
            imageUrl = "/assets/product-images/monstera-deliciosa.jpg",
            isArCompatible = false,
            categoryId = category!.Id,
            wateringIntervalDays = 7,
            fertilizingIntervalDays = 30,
            cleaningIntervalDays = 14,
            careInstructions = "Ilık oda ve dolaylı ışık."
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ProductDto>(JsonOptions))!;
    }

    private async Task<OrderDto> PlaceOrderForProductAsync(string customerToken, int productId)
    {
        SetBearer(customerToken);
        var addResponse = await _client.PostAsJsonAsync("/api/cart/items", new { productId, quantity = 1 });
        addResponse.EnsureSuccessStatusCode();
        var orderResponse = await _client.PostAsJsonAsync("/api/orders/from-cart", new { notes = "assistant-test" });
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

    private sealed class CategoryDto
    {
        public int Id { get; set; }
    }

    private sealed record AuthContext(string Token, int UserId);
}
