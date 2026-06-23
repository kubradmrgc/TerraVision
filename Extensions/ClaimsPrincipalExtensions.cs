using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace TerraVision.Api.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static bool TryGetUserId(this ClaimsPrincipal? principal, out int userId)
        {
            var userIdClaim = principal?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal?.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? principal?.FindFirstValue("sub");

            return int.TryParse(userIdClaim, out userId);
        }

        public static int GetRequiredUserId(this ClaimsPrincipal? principal)
        {
            if (!principal.TryGetUserId(out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user identity.");
            }

            return userId;
        }
    }
}
