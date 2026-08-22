using System.Net;
using System.Net.Sockets;

namespace TerraVision.Api.Services;

public static class ArModelUrlRules
{
    public const string InvalidUrlMessage =
        "AR model URL must be https and publicly reachable. Set MediaStorage:PublicBaseUrl to a public HTTPS CDN (or use S3 with a public bucket URL).";

    public static bool IsValidPublicHttpsUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return IsPublicHost(uri.Host);
    }

    public static void EnsureValidPublicHttpsUrl(string? url)
    {
        if (!IsValidPublicHttpsUrl(url))
        {
            throw new InvalidOperationException(InvalidUrlMessage);
        }
    }

    /// <summary>Development / LAN: HTTP model URLs reachable from emulator or USB device.</summary>
    public static bool IsValidDevelopmentArModelUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return IsDevelopmentReachableHost(uri.Host);
    }

    public static bool IsValidArModelUrl(string? url, bool allowDevelopmentLan)
    {
        if (IsValidPublicHttpsUrl(url))
        {
            return true;
        }

        return allowDevelopmentLan && IsValidDevelopmentArModelUrl(url);
    }

    private static bool IsDevelopmentReachableHost(string host)
    {
        if (string.IsNullOrWhiteSpace(host))
        {
            return false;
        }

        var normalized = host.Trim().ToLowerInvariant();
        if (normalized is "localhost" or "127.0.0.1" or "::1" or "10.0.2.2")
        {
            return true;
        }

        if (normalized.StartsWith('[') && normalized.EndsWith(']'))
        {
            normalized = normalized[1..^1];
        }

        if (!IPAddress.TryParse(normalized, out var address))
        {
            return false;
        }

        if (IPAddress.IsLoopback(address))
        {
            return true;
        }

        if (address.AddressFamily != AddressFamily.InterNetwork)
        {
            return false;
        }

        var bytes = address.GetAddressBytes();
        if (bytes[0] == 10)
        {
            return true;
        }

        if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31)
        {
            return true;
        }

        if (bytes[0] == 192 && bytes[1] == 168)
        {
            return true;
        }

        return false;
    }

    private static bool IsPublicHost(string host)
    {
        if (string.IsNullOrWhiteSpace(host))
        {
            return false;
        }

        var normalized = host.Trim().ToLowerInvariant();
        if (normalized is "localhost" or "127.0.0.1" or "::1" or "0.0.0.0")
        {
            return false;
        }

        if (normalized.StartsWith('[') && normalized.EndsWith(']'))
        {
            normalized = normalized[1..^1];
        }

        if (normalized.EndsWith(".local", StringComparison.Ordinal) ||
            normalized.EndsWith(".localhost", StringComparison.Ordinal) ||
            normalized.EndsWith(".internal", StringComparison.Ordinal))
        {
            return false;
        }

        if (!IPAddress.TryParse(normalized, out var address))
        {
            return true;
        }

        if (IPAddress.IsLoopback(address))
        {
            return false;
        }

        if (address.AddressFamily != AddressFamily.InterNetwork)
        {
            return true;
        }

        var bytes = address.GetAddressBytes();
        if (bytes[0] == 10)
        {
            return false;
        }

        if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31)
        {
            return false;
        }

        if (bytes[0] == 192 && bytes[1] == 168)
        {
            return false;
        }

        if (bytes[0] == 169 && bytes[1] == 254)
        {
            return false;
        }

        return true;
    }
}
