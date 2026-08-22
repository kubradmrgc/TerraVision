using Microsoft.AspNetCore.Http;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Services;

public static class ArPreviewUrlResolver
{
    public static string ResolveForClient(
        string modelUrl,
        HttpRequest request,
        MediaStorageSettings settings,
        string? clientBaseUrl)
    {
        if (string.IsNullOrWhiteSpace(modelUrl))
        {
            return modelUrl;
        }

        if (Uri.TryCreate(modelUrl, UriKind.Absolute, out var absolute))
        {
            if (absolute.Scheme is "http" or "https")
            {
                return modelUrl;
            }
        }

        var path = modelUrl.StartsWith('/') ? modelUrl : $"/{modelUrl}";

        if (!string.IsNullOrWhiteSpace(clientBaseUrl) &&
            Uri.TryCreate(clientBaseUrl.Trim(), UriKind.Absolute, out var clientBase) &&
            (clientBase.Scheme == Uri.UriSchemeHttp || clientBase.Scheme == Uri.UriSchemeHttps))
        {
            return $"{clientBase.GetLeftPart(UriPartial.Authority).TrimEnd('/')}{path}";
        }

        if (!string.IsNullOrWhiteSpace(settings.MobileDevBaseUrl) &&
            Uri.TryCreate(settings.MobileDevBaseUrl.Trim(), UriKind.Absolute, out var devBase) &&
            (devBase.Scheme == Uri.UriSchemeHttp || devBase.Scheme == Uri.UriSchemeHttps))
        {
            return $"{devBase.GetLeftPart(UriPartial.Authority).TrimEnd('/')}{path}";
        }

        if (!string.IsNullOrWhiteSpace(settings.PublicBaseUrl) &&
            Uri.TryCreate(settings.PublicBaseUrl.Trim(), UriKind.Absolute, out var publicBase) &&
            string.Equals(publicBase.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            var assetsPath = path.StartsWith("/assets/", StringComparison.OrdinalIgnoreCase)
                ? path["/assets/".Length..]
                : path.TrimStart('/');
            return $"{publicBase.GetLeftPart(UriPartial.Authority).TrimEnd('/')}/assets/{assetsPath.TrimStart('/')}";
        }

        return $"{request.Scheme}://{request.Host.Value}{path}";
    }
}
