using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TerraVision.Api.Enums;
using TerraVision.Api.Models.DTOs;
using Xunit;

namespace TerraVision.Api.Tests;

public class CareGardenWithoutPurchaseTests : IClassFixture<TerraVisionApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly HttpClient _client;

    public CareGardenWithoutPurchaseTests(TerraVisionApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AddPlantToGarden_WithoutOrder_CreatesCalendarAndAssistantUsesCatalog()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var customer = await RegisterAsync($"garden_{suffix}@t.test", UserRole.Customer);
        var admin = await RegisterAsync($"garden_adm_{suffix}@t.test", UserRole.Admin);

        var plant = await CreatePlantProductAsync(admin.Token);
        SetBearer(customer.Token);

        var addResponse = await _client.PostAsJsonAsync("/api/care/my-garden", new { productId = plant.Id });
        Assert.Equal(HttpStatusCode.OK, addResponse.StatusCode);

        var calendar = await addResponse.Content.ReadFromJsonAsync<PlantCareCalendarDto>(JsonOptions);
        Assert.NotNull(calendar);
        Assert.Equal(plant.Id, calendar!.ProductId);

        var chatResponse = await _client.PostAsJsonAsync("/api/care/assistant/chat", new
        {
            message = $"{plant.Name} nasıl sulanır?",
            productId = plant.Id
        });
        Assert.Equal(HttpStatusCode.OK, chatResponse.StatusCode);

        var chat = await chatResponse.Content.ReadFromJsonAsync<CareAssistantChatResponse>(JsonOptions);
        Assert.NotNull(chat);
        Assert.Contains(plant.Name, chat!.Reply, StringComparison.OrdinalIgnoreCase);
    }

    private async Task<AuthContext> RegisterAsync(string email, UserRole role)
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
        return new AuthContext(body!.Token, body.UserId);
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
            name = $"Garden Plant {Guid.NewGuid():N}"[..18],
            description = "Test",
            price = 29.9m,
            stockQuantity = 5,
            minStockLevel = 1,
            sku = $"G-{Guid.NewGuid():N}"[..10],
            imageUrl = "/assets/product-images/monstera-deliciosa.jpg",
            isArCompatible = false,
            categoryId = category!.Id,
            wateringIntervalDays = 7,
            careInstructions = "Haftada bir ılık su."
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ProductDto>(JsonOptions))!;
    }

    private sealed record AuthContext(string Token, int UserId);

    private sealed class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public int UserId { get; set; }
    }

    private sealed class CategoryDto
    {
        public int Id { get; set; }
    }

    private sealed class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
