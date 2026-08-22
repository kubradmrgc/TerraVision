using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Interfaces;

public interface IUserAdminService
{
    Task<PagedResult<AdminUserDto>> GetUsersAsync(AdminUserListQuery query, CancellationToken cancellationToken = default);
}
