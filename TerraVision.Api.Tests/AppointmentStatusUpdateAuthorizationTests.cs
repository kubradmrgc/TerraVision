using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TerraVision.Api.Enums;
using Xunit;

namespace TerraVision.Api.Tests;

/// <summary>
/// Integration coverage for PUT /api/appointments/{id}/status across roles and ownership.
/// </summary>
public class AppointmentStatusUpdateAuthorizationTests : IClassFixture<TerraVisionApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly TerraVisionApiFactory _factory;
    private readonly HttpClient _client;

    public AppointmentStatusUpdateAuthorizationTests(TerraVisionApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Consultant_AssignedToAppointment_ReturnsOk()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var consultant = await RegisterAsync($"cons_{suffix}@t.test", UserRole.Consultant);
        var customer = await RegisterAsync($"cust_{suffix}@t.test", UserRole.Customer);
        var appointmentId = await CreateAppointmentAsync(customer.Token, consultant.UserId);

        var response = await PutStatusAsync(consultant.Token, appointmentId, AppointmentStatus.Approved);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Admin_CanUpdateAppointment_ReturnsOk()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var consultant = await RegisterAsync($"cons2_{suffix}@t.test", UserRole.Consultant);
        var customer = await RegisterAsync($"cust2_{suffix}@t.test", UserRole.Customer);
        var admin = await RegisterAsync($"adm_{suffix}@t.test", UserRole.Admin);
        var appointmentId = await CreateAppointmentAsync(customer.Token, consultant.UserId);

        var response = await PutStatusAsync(admin.Token, appointmentId, AppointmentStatus.Approved);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task OtherConsultant_NotAssigned_ReturnsUnauthorized()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var consultantA = await RegisterAsync($"consA_{suffix}@t.test", UserRole.Consultant);
        var consultantB = await RegisterAsync($"consB_{suffix}@t.test", UserRole.Consultant);
        var customer = await RegisterAsync($"cust3_{suffix}@t.test", UserRole.Customer);
        var appointmentId = await CreateAppointmentAsync(customer.Token, consultantA.UserId);

        var response = await PutStatusAsync(consultantB.Token, appointmentId, AppointmentStatus.Approved);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Customer_ReturnsForbidden()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var consultant = await RegisterAsync($"cons4_{suffix}@t.test", UserRole.Consultant);
        var customer = await RegisterAsync($"cust4_{suffix}@t.test", UserRole.Customer);
        var appointmentId = await CreateAppointmentAsync(customer.Token, consultant.UserId);

        var response = await PutStatusAsync(customer.Token, appointmentId, AppointmentStatus.Approved);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Unauthenticated_ReturnsUnauthorized()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var consultant = await RegisterAsync($"cons5_{suffix}@t.test", UserRole.Consultant);
        var customer = await RegisterAsync($"cust5_{suffix}@t.test", UserRole.Customer);
        var appointmentId = await CreateAppointmentAsync(customer.Token, consultant.UserId);

        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.PutAsJsonAsync(
            $"/api/appointments/{appointmentId}/status",
            new { id = appointmentId, status = (int)AppointmentStatus.Approved });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task RouteId_BodyIdMismatch_ReturnsBadRequest()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var consultant = await RegisterAsync($"cons6_{suffix}@t.test", UserRole.Consultant);
        var customer = await RegisterAsync($"cust6_{suffix}@t.test", UserRole.Customer);
        var appointmentId = await CreateAppointmentAsync(customer.Token, consultant.UserId);

        var response = await PutStatusRawAsync(consultant.Token, appointmentId, appointmentId + 999, AppointmentStatus.Approved);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<AuthContext> RegisterAsync(string email, UserRole role)
    {
        var created = await TestAuth.CreateUserAsync(_factory, _client, email, role);
        return new AuthContext(created.Token, created.UserId);
    }

    private async Task<int> CreateAppointmentAsync(string customerToken, int consultantUserId)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", customerToken);
        var response = await _client.PostAsJsonAsync("/api/Appointments", new
        {
            consultantId = consultantUserId,
            appointmentDate = DateTime.UtcNow.AddDays(1),
            notes = "integration"
        });
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<AppointmentCreatedDto>(JsonOptions);
        Assert.NotNull(created);
        return created!.Id;
    }

    private async Task<HttpResponseMessage> PutStatusAsync(string bearerToken, int appointmentId, AppointmentStatus status)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
        return await _client.PutAsJsonAsync(
            $"/api/appointments/{appointmentId}/status",
            new { id = appointmentId, status = (int)status });
    }

    private async Task<HttpResponseMessage> PutStatusRawAsync(string bearerToken, int routeId, int bodyId, AppointmentStatus status)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
        return await _client.PutAsJsonAsync(
            $"/api/appointments/{routeId}/status",
            new { id = bodyId, status = (int)status });
    }

    private sealed record AuthContext(string Token, int UserId);

    private sealed class AppointmentCreatedDto
    {
        public int Id { get; set; }
    }
}
