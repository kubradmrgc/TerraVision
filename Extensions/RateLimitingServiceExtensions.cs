using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Extensions;

public static class RateLimitPolicies
{
    public const string AuthSensitive = "auth-sensitive";
    public const string AppointmentsWrite = "appointments-write";
    public const string CatalogRead = "catalog-read";
    public const string CareAssistantChat = "care-assistant-chat";
    public const string SupportFeedback = "support-feedback";
}

public static class RateLimitingServiceExtensions
{
    public static IServiceCollection AddTerraVisionRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        if (environment.IsEnvironment("Testing"))
        {
            return services;
        }

        services.Configure<RateLimitingSettings>(configuration.GetSection(RateLimitingSettings.SectionName));
        var settings = configuration.GetSection(RateLimitingSettings.SectionName).Get<RateLimitingSettings>()
                       ?? new RateLimitingSettings();

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
                }

                await context.HttpContext.Response.WriteAsJsonAsync(
                    new { message = "Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin." },
                    cancellationToken);
            };

            options.AddPolicy(RateLimitPolicies.AuthSensitive, httpContext =>
                CreateFixedWindowPartition(
                    $"auth:{GetClientIp(httpContext)}",
                    settings.AuthSensitive));

            options.AddPolicy(RateLimitPolicies.AppointmentsWrite, httpContext =>
                CreateFixedWindowPartition(
                    $"appt:{GetUserOrClientPartitionKey(httpContext)}",
                    settings.AppointmentsWrite));

            options.AddPolicy(RateLimitPolicies.CatalogRead, httpContext =>
                CreateFixedWindowPartition(
                    $"catalog:{GetClientIp(httpContext)}",
                    settings.CatalogRead));

            options.AddPolicy(RateLimitPolicies.CareAssistantChat, httpContext =>
                CreateFixedWindowPartition(
                    $"care-ai:{GetUserOrClientPartitionKey(httpContext)}",
                    settings.CareAssistantChat));

            options.AddPolicy(RateLimitPolicies.SupportFeedback, httpContext =>
                CreateFixedWindowPartition(
                    $"support-fb:{GetClientIp(httpContext)}",
                    settings.SupportFeedback));
        });

        return services;
    }

    private static RateLimitPartition<string> CreateFixedWindowPartition(
        string partitionKey,
        RateLimitPolicySettings policy)
    {
        var window = TimeSpan.FromMinutes(Math.Max(1, policy.WindowMinutes));
        var permitLimit = Math.Max(1, policy.PermitLimit);

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = window,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    }

    internal static string GetClientIp(HttpContext context)
    {
        var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            var firstHop = forwarded.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(firstHop))
            {
                return firstHop;
            }
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private static string GetUserOrClientPartitionKey(HttpContext context)
    {
        var userId = context.User.FindFirst("sub")?.Value
                     ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(userId))
        {
            return $"user:{userId}";
        }

        return $"ip:{GetClientIp(context)}";
    }
}
