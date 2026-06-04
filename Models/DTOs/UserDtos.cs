using TerraVision.Api.Enums;

namespace TerraVision.Api.Models.DTOs;

public class AdminUserListQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public UserRole? Role { get; set; }
    public string? Search { get; set; }
    public bool IncludeInactive { get; set; }
}

public class AdminUserDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public bool IsActive { get; set; }
}
