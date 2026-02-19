using FriendNetApp.SocialService.Data;
using FriendNetApp.SocialService.Models;
using Microsoft.EntityFrameworkCore;

namespace FriendNetApp.SocialService.App.Matching.Commands
{
    public class RejectMatch
    {
        public class Command
        {
            public required Guid UserId { get; set; }
            public required Guid MatchId { get; set; }
        }

        public class Handler(SocialDbContext context)
        {
            public async Task Handle(Command command, CancellationToken cancellationToken)
            {
                var match = await context.Matches.FirstOrDefaultAsync(
                    m => m.Id == command.MatchId, cancellationToken);

                if (match == null)
                    throw new ArgumentException("Match not found.");

                if (match.Status != MatchStatus.Pending)
                    throw new InvalidOperationException("Match is no longer pending.");

                if (match.User1Id != command.UserId && match.User2Id != command.UserId)
                    throw new InvalidOperationException("User is not part of this match.");

                match.Status = MatchStatus.Rejected;
                await context.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
