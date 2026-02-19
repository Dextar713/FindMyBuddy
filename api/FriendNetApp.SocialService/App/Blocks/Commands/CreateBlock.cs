using FriendNetApp.SocialService.Data;
using FriendNetApp.SocialService.Models;
using Microsoft.EntityFrameworkCore;

namespace FriendNetApp.SocialService.App.Blocks.Commands
{
    public class CreateBlock
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
                if (command.BlockerId == command.BlockedId)
                    throw new ArgumentException("A user cannot block themselves.");

                if (!await context.UserNodes.AnyAsync(u => u.Id == command.BlockedId, cancellationToken))
                    throw new ArgumentException("The user to block does not exist.");

                var alreadyBlocked = await context.Blocks.AnyAsync(
                    b => b.BlockerId == command.BlockerId && b.BlockedId == command.BlockedId,
                    cancellationToken);

                if (alreadyBlocked)
                    throw new InvalidOperationException("User is already blocked.");

                var block = new Block
                {
                    BlockerId = command.BlockerId,
                    BlockedId = command.BlockedId,
                };

                await context.Blocks.AddAsync(block, cancellationToken);
                await context.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
