using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Controllers
{
    [ApiController]
    [Route("api/campaigns")]
    public class CampaignsController : ControllerBase
    {
        private readonly ICampaignService _campaignService;

        public CampaignsController(ICampaignService campaignService)
        {
            _campaignService = campaignService;
        }

        [HttpGet("storefront")]
        [AllowAnonymous]
        public async Task<IActionResult> GetStorefront()
        {
            var storefront = await _campaignService.GetStorefrontAsync();
            return Ok(storefront);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var items = await _campaignService.GetAllCampaignsAsync();
            return Ok(items);
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _campaignService.GetCampaignByIdAsync(id);
            return Ok(item);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] UpsertStoreCampaignRequest request)
        {
            var created = await _campaignService.CreateCampaignAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpsertStoreCampaignRequest request)
        {
            var updated = await _campaignService.UpdateCampaignAsync(id, request);
            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            await _campaignService.DeleteCampaignAsync(id);
            return NoContent();
        }

        [HttpPut("products/{productId:int}/promotion")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProductPromotion(int productId, [FromBody] UpdateProductPromotionRequest request)
        {
            var product = await _campaignService.UpdateProductPromotionAsync(productId, request);
            return Ok(product);
        }
    }
}
