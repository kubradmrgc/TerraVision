using TerraVision.Api.Entities;

namespace TerraVision.Api.Interfaces
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(User user);
        DateTime GetAccessTokenExpiryUtc();
        string GenerateRefreshToken();
    }
}
