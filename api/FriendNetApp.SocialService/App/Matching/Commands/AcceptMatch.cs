using FriendNetApp.Contracts.Events;
using FriendNetApp.SocialService.Data;
using FriendNetApp.SocialService.Models;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace FriendNetApp.SocialService.App.Matching.Commands
{
    public class AcceptMatch
    {
        public class Command
        {
            public required Guid UserId { get; set; }
            public required Guid MatchId { get; set; }
        }

        /// <summary>
        /// Returns true when both users have now accepted (match fully accepted).
        /// Side effects on full acceptance: creates Friendship + publishes MatchAcceptedEvent
        /// so the Messaging service can open a chat between the two users.
        /// </summary>
        public class Handler(SocialDbContext context, IPublishEndpoint publish)
        {
            public async Task<bool> Handle(Command command, CancellationToken cancellationToken)
            {
                var match = await context.Matches.FirstOrDefaultAsync(
                    m => m.Id == command.MatchId, cancellationToken);

                if (match == null)
                    throw new ArgumentException("Match not found.");

                if (match.Status == MatchStatus.Rejected)
                    throw new InvalidOperationException("Match has already been rejected.");

                if (match.Status == MatchStatus.Accepted)
                    throw new InvalidOperationException("Match has already been accepted.");

                if (match.User1Id == command.UserId)
                    match.User1Accepted = true;
                else if (match.User2Id == command.UserId)
                    match.User2Accepted = true;
                else
                    throw new InvalidOperationException("User is not part of this match.");

                if (match.User1Accepted && match.User2Accepted)
                {
                    match.Status = MatchStatus.Accepted;
                    await context.SaveChangesAsync(cancellationToken);

                    // Create Friendship if it does not already exist
                    var friendshipExists = await context.Friendships.AnyAsync(f =>
                        (f.User1Id == match.User1Id && f.User2Id == match.User2Id) ||
                        (f.User1Id == match.User2Id && f.User2Id == match.User1Id),
                        cancellationToken);

                    if (!friendshipExists)
                    {
                        await context.Friendships.AddAsync(new Friendship
                        {
                            User1Id = match.User1Id,
                            User2Id = match.User2Id,
                        }, cancellationToken);
                        await context.SaveChangesAsync(cancellationToken);
                    }

                    // Notify Messaging service to open a chat between the two users
                    await publish.Publish(
                        new MatchAcceptedEvent(match.User1Id, match.User2Id),
                        cancellationToken);

                    return true;
                }

                await context.SaveChangesAsync(cancellationToken);
                return false;
            }
        }
    }
}
