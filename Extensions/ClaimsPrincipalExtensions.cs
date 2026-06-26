using System.Security.Claims;

namespace TerraVision.Api.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static string? GetUserIdValue(this ClaimsPrincipal principal)
        {
            return principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.FindFirstValue("sub");
        }
    }
}
