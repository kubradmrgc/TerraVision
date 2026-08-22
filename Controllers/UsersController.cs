using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserAdminService _userAdminService;

    public UsersController(IUserAdminService userAdminService)
    {
        _userAdminService = userAdminService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] AdminUserListQuery query, CancellationToken cancellationToken)
    {
        var result = await _userAdminService.GetUsersAsync(query, cancellationToken);
        return Ok(result);
    }
}
