using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace TerraVision.Api.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static bool TryGetUserId(this ClaimsPrincipal principal, out int userId)
        {
            var userIdClaim = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? principal.FindFirstValue("sub");

            return int.TryParse(userIdClaim, out userId);
        }
    }
}
