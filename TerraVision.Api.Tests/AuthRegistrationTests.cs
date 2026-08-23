using System.Net;
using System.Net.Http.Json;
using TerraVision.Api.Enums;
using Xunit;

namespace TerraVision.Api.Tests;

public class AuthRegistrationTests : IClassFixture<TerraVisionApiFactory>
{
    private readonly HttpClient _client;

    public AuthRegistrationTests(TerraVisionApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_WithAdminRole_CreatesCustomerOnly()
    {
        var email = $"esc_{Guid.NewGuid():N}"[..20] + "@t.test";
        var created = await TestAuth.RegisterViaPublicApiAsync(_client, email, UserRole.Admin);

        Assert.Equal(UserRole.Customer, created.Role);

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", created.Token);
        var adminOnly = await _client.GetAsync("/api/users");
        Assert.Equal(HttpStatusCode.Forbidden, adminOnly.StatusCode);
    }
}
