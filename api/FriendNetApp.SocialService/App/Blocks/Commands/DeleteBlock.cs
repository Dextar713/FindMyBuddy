using FriendNetApp.SocialService.Data;
using Microsoft.EntityFrameworkCore;

namespace FriendNetApp.SocialService.App.Blocks.Commands
{
    public class DeleteBlock
    {
        public class Command
        {
            public required Guid BlockerId { get; set; }
            public required Guid BlockedId { get; set; }
        }

        public class Handler(SocialDbContext context)
        {
            public async Task Handle(Command command, CancellationToken cancellationToken)
            {
                var block = await context.Blocks.FirstOrDefaultAsync(
                    b => b.BlockerId == command.BlockerId && b.BlockedId == command.BlockedId,
                    cancellationToken);

                if (block == null)
                    throw new ArgumentException("Block does not exist.");

                context.Blocks.Remove(block);
                await context.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
