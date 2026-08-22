using Microsoft.EntityFrameworkCore;
using TerraVision.Api.Data;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Services;

public class UserAdminService : IUserAdminService
{
    private readonly TerraVisionDbContext _dbContext;

    public UserAdminService(TerraVisionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(
        AdminUserListQuery query,
        CancellationToken cancellationToken = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize is < 1 or > 100 ? 20 : query.PageSize;

        var baseQuery = _dbContext.Users.AsNoTracking().Where(u => !u.IsDeleted);

        if (!query.IncludeInactive)
        {
            baseQuery = baseQuery.Where(u => u.IsActive);
        }

        if (query.Role.HasValue)
        {
            baseQuery = baseQuery.Where(u => u.Role == query.Role.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLowerInvariant();
            baseQuery = baseQuery.Where(u =>
                u.Email.ToLower().Contains(term) ||
                u.FirstName.ToLower().Contains(term) ||
                u.LastName.ToLower().Contains(term));
        }

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var users = await baseQuery
            .OrderByDescending(u => u.CreatedDate)
            .ThenBy(u => u.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Role = u.Role,
                CreatedDate = u.CreatedDate,
                UpdatedDate = u.UpdatedDate,
                IsActive = u.IsActive
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminUserDto>
        {
            Items = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}
