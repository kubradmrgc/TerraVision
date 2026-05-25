using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using TerraVision.Api.Enums;
using Xunit;

namespace TerraVision.Api.Tests;

/// <summary>
/// Slot double-booking and optimistic concurrency for appointments.
/// </summary>
public class AppointmentConcurrencyTests : IClassFixture<TerraVisionApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _client;

    public AppointmentConcurrencyTests(TerraVisionApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Create_SameConsultantAndSlot_SecondRequestReturnsConflict()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var consultant = await RegisterAsync($"slot_cons_{suffix}@t.test", UserRole.Consultant);
        var customerA = await RegisterAsync($"slot_custA_{suffix}@t.test", UserRole.Customer);
        var customerB = await RegisterAsync($"slot_custB_{suffix}@t.test", UserRole.Customer);

        var slot = DateTime.UtcNow.AddDays(2);
        slot = new DateTime(slot.Year, slot.Month, slot.Day, slot.Hour, slot.Minute, 0, DateTimeKind.Utc);

        var first = await CreateAppointmentRawAsync(customerA.Token, consultant.UserId, slot);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await CreateAppointmentRawAsync(customerB.Token, consultant.UserId, slot);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Create_AfterConsultantCancelsSameSlot_AllowsRebook()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var consultant = await RegisterAsync($"rebook_cons_{suffix}@t.test", UserRole.Consultant);
        var customerA = await RegisterAsync($"rebook_custA_{suffix}@t.test", UserRole.Customer);
        var customerB = await RegisterAsync($"rebook_custB_{suffix}@t.test", UserRole.Customer);

        var slot = DateTime.UtcNow.AddDays(3);
        slot = new DateTime(slot.Year, slot.Month, slot.Day, slot.Hour, slot.Minute, 0, DateTimeKind.Utc);

        var appointmentId = await CreateAppointmentAsync(customerA.Token, consultant.UserId, slot);
        var cancel = await PutStatusAsync(consultant.Token, appointmentId, AppointmentStatus.Cancelled);
        Assert.Equal(HttpStatusCode.OK, cancel.StatusCode);

        var rebook = await CreateAppointmentRawAsync(customerB.Token, consultant.UserId, slot);
        Assert.Equal(HttpStatusCode.Created, rebook.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_WithStaleRowVersion_ReturnsConflict()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var consultant = await RegisterAsync($"stale_cons_{suffix}@t.test", UserRole.Consultant);
        var customer = await RegisterAsync($"stale_cust_{suffix}@t.test", UserRole.Customer);

        var appointmentId = await CreateAppointmentAsync(customer.Token, consultant.UserId, DateTime.UtcNow.AddDays(4));
        var snapshot = await GetAppointmentAsync(consultant.Token, appointmentId);
        Assert.NotNull(snapshot?.RowVersion);
        Assert.NotEmpty(snapshot!.RowVersion);

        var firstUpdate = await PutStatusAsync(consultant.Token, appointmentId, AppointmentStatus.Approved);
        Assert.Equal(HttpStatusCode.OK, firstUpdate.StatusCode);

        var stale = await PutStatusWithRowVersionAsync(
            consultant.Token,
            appointmentId,
            AppointmentStatus.Completed,
            snapshot.RowVersion);
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
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
        Assert.NotNull(body?.Token);
        return new AuthContext(body!.Token, body.UserId);
    }

    private async Task<int> CreateAppointmentAsync(string customerToken, int consultantUserId, DateTime slot)
    {
        var response = await CreateAppointmentRawAsync(customerToken, consultantUserId, slot);
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<AppointmentCreatedDto>(JsonOptions);
        Assert.NotNull(created);
        return created!.Id;
    }

    private async Task<HttpResponseMessage> CreateAppointmentRawAsync(string customerToken, int consultantUserId, DateTime slot)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", customerToken);
        return await _client.PostAsJsonAsync("/api/Appointments", new
        {
            consultantId = consultantUserId,
            appointmentDate = slot,
            notes = "concurrency-test"
        });
    }

    private async Task<AppointmentDto?> GetAppointmentAsync(string bearerToken, int appointmentId)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
        var response = await _client.GetAsync($"/api/appointments/{appointmentId}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AppointmentDto>(JsonOptions);
    }

    private async Task<HttpResponseMessage> PutStatusAsync(string bearerToken, int appointmentId, AppointmentStatus status)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
        return await _client.PutAsJsonAsync(
            $"/api/appointments/{appointmentId}/status",
            new { id = appointmentId, status = (int)status });
    }

    private async Task<HttpResponseMessage> PutStatusWithRowVersionAsync(
        string bearerToken,
        int appointmentId,
        AppointmentStatus status,
        byte[] rowVersion)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
        return await _client.PutAsJsonAsync(
            $"/api/appointments/{appointmentId}/status",
            new { id = appointmentId, status = (int)status, rowVersion });
    }

    private sealed record AuthContext(string Token, int UserId);

    private sealed class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public int UserId { get; set; }
    }

    private sealed class AppointmentCreatedDto
    {
        public int Id { get; set; }
    }

    private sealed class AppointmentDto
    {
        public int Id { get; set; }
        public byte[] RowVersion { get; set; } = Array.Empty<byte>();
    }
}
