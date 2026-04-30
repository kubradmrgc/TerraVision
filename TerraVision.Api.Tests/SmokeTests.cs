using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace TerraVision.Api.Tests;

public class SmokeTests : IClassFixture<TerraVisionApiFactory>
{
    private readonly HttpClient _client;

    public SmokeTests(TerraVisionApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetProducts_AllowsAnonymous_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/Products");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/Auth/login", new
        {
            email = "nobody@example.com",
            password = "wrong-password"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
