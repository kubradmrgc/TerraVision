using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR.Client;
using TerraVision.Api.Enums;
using TerraVision.Api.Hubs;
using Xunit;

namespace TerraVision.Api.Tests;

public class ExchangeTests : IClassFixture<TerraVisionApiFactory>
{
    private readonly HttpClient _client;
    private readonly TerraVisionApiFactory _factory;

    public ExchangeTests(TerraVisionApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateListing_IsVisibleToOtherUser_AndBroadcastsListedEvent()
    {
        var sellerToken = await RegisterAndLoginAsync($"seller_{Guid.NewGuid():N}@t.test");
        var buyerToken = await RegisterAndLoginAsync($"buyer_{Guid.NewGuid():N}@t.test");

        var listedTcs = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
        var buyerUserId = await GetUserIdFromTokenAsync(buyerToken);

        await using var hubConnection = await ConnectHubAsync(buyerToken, buyerUserId, listedTcs);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", sellerToken);
        var create = await _client.PostAsJsonAsync("/api/exchange/products", new
        {
            title = "Monstera Takas",
            description = "Sağlıklı monstera",
            price = 0m,
            condition = (int)ExchangeCondition.Healthy,
            photoUrls = new[] { "https://example.test/monstera.jpg" }
        });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var created = await create.Content.ReadFromJsonAsync<JsonElement>();
        var productId = created.GetProperty("id").GetInt32();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var listResponse = await _client.GetAsync("/api/exchange/products");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        var listJson = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Array, listJson.ValueKind);
        Assert.Contains(listJson.EnumerateArray(), item => item.GetProperty("id").GetInt32() == productId);

        var listedEvent = await listedTcs.Task.WaitAsync(TimeSpan.FromSeconds(8));
        Assert.Equal(productId, listedEvent.GetProperty("product").GetProperty("id").GetInt32());
    }

    [Fact]
    public async Task CreateOffer_NotifiesOwnerViaSignalR()
    {
        var ownerToken = await RegisterAndLoginAsync($"owner_{Guid.NewGuid():N}@t.test");
        var senderToken = await RegisterAndLoginAsync($"sender_{Guid.NewGuid():N}@t.test");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var create = await _client.PostAsJsonAsync("/api/exchange/products", new
        {
            title = "Lavanta Saksı",
            description = "Takas için",
            price = 0m,
            condition = (int)ExchangeCondition.Used,
            photoUrls = new[] { "https://example.test/lavender.jpg" }
        });
        var created = await create.Content.ReadFromJsonAsync<JsonElement>();
        var productId = created.GetProperty("id").GetInt32();
        var ownerUserId = await GetUserIdFromTokenAsync(ownerToken);

        var offerTcs = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
        await using var hubConnection = await ConnectHubAsync(ownerToken, ownerUserId, offerTcs, TerraVisionHub.ExchangeOfferReceivedEventName);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", senderToken);
        var offer = await _client.PostAsJsonAsync("/api/exchange/offers", new
        {
            productId,
            offerType = (int)ExchangeOfferType.Swap,
            message = "Ficus ile takas yapmak isterim"
        });
        Assert.Equal(HttpStatusCode.Created, offer.StatusCode);

        var evt = await offerTcs.Task.WaitAsync(TimeSpan.FromSeconds(8));
        Assert.Equal(productId, evt.GetProperty("productId").GetInt32());
        Assert.Equal("Ficus ile takas yapmak isterim", evt.GetProperty("message").GetString());
    }

    [Fact]
    public async Task RejectOffer_NotifiesSenderViaSignalR()
    {
        var ownerToken = await RegisterAndLoginAsync($"owner2_{Guid.NewGuid():N}@t.test");
        var senderToken = await RegisterAndLoginAsync($"sender2_{Guid.NewGuid():N}@t.test");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var create = await _client.PostAsJsonAsync("/api/exchange/products", new
        {
            title = "Fiddle Leaf",
            description = "Satılık",
            price = 150m,
            condition = (int)ExchangeCondition.Healthy,
            photoUrls = new[] { "https://example.test/fiddle.jpg" }
        });
        var created = await create.Content.ReadFromJsonAsync<JsonElement>();
        var productId = created.GetProperty("id").GetInt32();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", senderToken);
        var offerResponse = await _client.PostAsJsonAsync("/api/exchange/offers", new
        {
            productId,
            offerType = (int)ExchangeOfferType.Buy,
            message = "150 TL teklifim"
        });
        var offerJson = await offerResponse.Content.ReadFromJsonAsync<JsonElement>();
        var offerId = offerJson.GetProperty("id").GetInt32();
        var senderUserId = await GetUserIdFromTokenAsync(senderToken);

        var statusTcs = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
        await using var hubConnection = await ConnectHubAsync(
            senderToken,
            senderUserId,
            statusTcs,
            TerraVisionHub.ExchangeOfferStatusChangedEventName);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var reject = await _client.PutAsJsonAsync($"/api/exchange/offers/{offerId}/status", new
        {
            id = offerId,
            status = (int)ExchangeOfferStatus.Rejected
        });
        Assert.Equal(HttpStatusCode.OK, reject.StatusCode);

        var evt = await statusTcs.Task.WaitAsync(TimeSpan.FromSeconds(8));
        Assert.Equal(offerId, evt.GetProperty("offerId").GetInt32());
        Assert.Equal((int)ExchangeOfferStatus.Rejected, evt.GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task AcceptOffer_RejectsSiblingOffers_AndBlocksSecondAccept()
    {
        var ownerToken = await RegisterAndLoginAsync($"owner_acc_{Guid.NewGuid():N}@t.test");
        var buyerAToken = await RegisterAndLoginAsync($"buyerA_{Guid.NewGuid():N}@t.test");
        var buyerBToken = await RegisterAndLoginAsync($"buyerB_{Guid.NewGuid():N}@t.test");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var create = await _client.PostAsJsonAsync("/api/exchange/products", new
        {
            title = "Tek ilan, iki teklif",
            description = "Benzersiz bitki",
            price = 0m,
            condition = (int)ExchangeCondition.Healthy,
            photoUrls = new[] { "https://example.test/unique-plant.jpg" }
        });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var productId = (await create.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerAToken);
        var offerAResponse = await _client.PostAsJsonAsync("/api/exchange/offers", new
        {
            productId,
            offerType = (int)ExchangeOfferType.Swap,
            message = "A teklifi"
        });
        Assert.Equal(HttpStatusCode.Created, offerAResponse.StatusCode);
        var offerAId = (await offerAResponse.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerBToken);
        var offerBResponse = await _client.PostAsJsonAsync("/api/exchange/offers", new
        {
            productId,
            offerType = (int)ExchangeOfferType.Swap,
            message = "B teklifi"
        });
        Assert.Equal(HttpStatusCode.Created, offerBResponse.StatusCode);
        var offerBId = (await offerBResponse.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var acceptA = await _client.PutAsJsonAsync($"/api/exchange/offers/{offerAId}/status", new
        {
            id = offerAId,
            status = (int)ExchangeOfferStatus.Accepted
        });
        Assert.Equal(HttpStatusCode.OK, acceptA.StatusCode);

        var received = await _client.GetFromJsonAsync<JsonElement>("/api/exchange/offers/received");
        Assert.Equal(JsonValueKind.Array, received.ValueKind);
        var receivedOffers = received.EnumerateArray().ToDictionary(o => o.GetProperty("id").GetInt32());
        Assert.Equal((int)ExchangeOfferStatus.Accepted, receivedOffers[offerAId].GetProperty("status").GetInt32());
        Assert.Equal((int)ExchangeOfferStatus.Rejected, receivedOffers[offerBId].GetProperty("status").GetInt32());

        var listing = await _client.GetFromJsonAsync<JsonElement>($"/api/exchange/products/{productId}");
        Assert.Equal((int)ExchangeProductStatus.Pending, listing.GetProperty("status").GetInt32());

        var acceptB = await _client.PutAsJsonAsync($"/api/exchange/offers/{offerBId}/status", new
        {
            id = offerBId,
            status = (int)ExchangeOfferStatus.Accepted
        });
        Assert.Equal(HttpStatusCode.BadRequest, acceptB.StatusCode);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerBToken);
        var sentB = await _client.GetFromJsonAsync<JsonElement>("/api/exchange/offers/sent");
        var buyerBOffer = sentB.EnumerateArray().Single(o => o.GetProperty("id").GetInt32() == offerBId);
        Assert.Equal((int)ExchangeOfferStatus.Rejected, buyerBOffer.GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task CreateOffer_RejectsMessageWithLinks()
    {
        var ownerToken = await RegisterAndLoginAsync($"owner3_{Guid.NewGuid():N}@t.test");
        var senderToken = await RegisterAndLoginAsync($"sender3_{Guid.NewGuid():N}@t.test");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var create = await _client.PostAsJsonAsync("/api/exchange/products", new
        {
            title = "Test",
            description = "Test",
            price = 0m,
            condition = (int)ExchangeCondition.New,
            photoUrls = new[] { "https://example.test/p.jpg" }
        });
        var productId = (await create.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", senderToken);
        var offer = await _client.PostAsJsonAsync("/api/exchange/offers", new
        {
            productId,
            offerType = (int)ExchangeOfferType.Swap,
            message = "Bak https://evil.test"
        });
        Assert.Equal(HttpStatusCode.BadRequest, offer.StatusCode);
    }

    private async Task<string> RegisterAndLoginAsync(string email)
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var register = await _client.PostAsJsonAsync("/api/Auth/register", new
        {
            firstName = "Ex",
            lastName = "User",
            email,
            password = "TestPwd!1",
            role = (int)UserRole.Customer
        });
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);

        var login = await _client.PostAsJsonAsync("/api/Auth/login", new { email, password = "TestPwd!1" });
        var loginJson = await login.Content.ReadFromJsonAsync<JsonElement>();
        return loginJson.GetProperty("token").GetString()!;
    }

    private static Task<int> GetUserIdFromTokenAsync(string token)
    {
        var parts = token.Split('.');
        var payload = parts[1];
        var padded = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
        var bytes = Convert.FromBase64String(padded.Replace('-', '+').Replace('_', '/'));
        using var doc = JsonDocument.Parse(bytes);
        return Task.FromResult(int.Parse(doc.RootElement.GetProperty("sub").GetString()!));
    }

    private async Task<HubConnection> ConnectHubAsync(
        string token,
        int userId,
        TaskCompletionSource<JsonElement> tcs,
        string eventName = TerraVisionHub.ExchangeProductListedEventName)
    {
        var server = _factory.Server;
        var connection = new HubConnectionBuilder()
            .WithUrl($"{server.BaseAddress}hubs/terravision", options =>
            {
                options.HttpMessageHandlerFactory = _ => server.CreateHandler();
                options.AccessTokenProvider = () => Task.FromResult<string?>(token);
            })
            .Build();

        connection.On<JsonElement>(eventName, payload => tcs.TrySetResult(payload));
        await connection.StartAsync();
        Assert.NotNull(connection.ConnectionId);
        _ = userId;
        return connection;
    }
}
