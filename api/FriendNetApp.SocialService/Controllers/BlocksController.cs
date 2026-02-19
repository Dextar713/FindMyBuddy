using FriendNetApp.SocialService.App.Blocks.Commands;
using FriendNetApp.SocialService.App.Blocks.Queries;
using FriendNetApp.SocialService.Dto;
using FriendNetApp.SocialService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FriendNetApp.SocialService.Controllers
{
    [Route("social/blocks")]
    public class BlocksController(
        ILogger<BlocksController> logger,
        IUserAccessor userAccessor,
        CreateBlock.Handler createHandler,
        DeleteBlock.Handler deleteHandler,
        GetBlocks.Handler getHandler) : ControllerBase
    {
        [HttpGet]
        [Authorize(Roles = "Admin,Client")]
        public async Task<IActionResult> GetBlocks()
        {
            try
            {
                var user = await userAccessor.GetCurrentUserAsync();
                var blocks = await getHandler.Handle(new GetBlocks.Query { BlockerId = user.Id }, CancellationToken.None);
                return Ok(blocks);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving blocks");
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Client")]
        public async Task<IActionResult> BlockUser([FromBody] BlockRequestDto request)
        {
            try
            {
                var user = await userAccessor.GetCurrentUserAsync();
                await createHandler.Handle(new CreateBlock.Command
                {
                    BlockerId = user.Id,
                    BlockedId = request.BlockedId
                }, CancellationToken.None);
                return Ok("User blocked.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error blocking user");
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{blockedId}")]
        [Authorize(Roles = "Admin,Client")]
        public async Task<IActionResult> UnblockUser(Guid blockedId)
        {
            try
            {
                var user = await userAccessor.GetCurrentUserAsync();
                await deleteHandler.Handle(new DeleteBlock.Command
                {
                    BlockerId = user.Id,
                    BlockedId = blockedId
                }, CancellationToken.None);
                return Ok("User unblocked.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error unblocking user");
                return BadRequest(ex.Message);
            }
        }
    }
}
