using AutoMapper;
using FriendNetApp.SocialService.Data;
using FriendNetApp.SocialService.Dto;
using FriendNetApp.SocialService.Models;
using Microsoft.EntityFrameworkCore;

namespace FriendNetApp.SocialService.App.Matching.Commands
{
    public class RandomMatch
    {
        public class Command
        {
            public required string UserId { get; set; }
            public required RandomMatchFiltersDto Filters { get; set; }
        }

        public class Handler(SocialDbContext context, IMapper mapper)
        {
            public async Task<MatchDto> Handle(Command command, CancellationToken cancellationToken)
            {
                var userId = Guid.Parse(command.UserId);

                // 1. Collect friend IDs (Friendship is stored in one canonical direction but queried bidirectionally)
                var friendIds = await context.Friendships
                    .Where(f => f.User1Id == userId || f.User2Id == userId)
                    .Select(f => f.User1Id == userId ? f.User2Id : f.User1Id)
                    .ToListAsync(cancellationToken);

                // 2. Collect block IDs in both directions:
                //    - users the current user has blocked
                //    - users who have blocked the current user
                var blockedByMe = await context.Blocks
                    .Where(b => b.BlockerId == userId)
                    .Select(b => b.BlockedId)
                    .ToListAsync(cancellationToken);

                var blockedMe = await context.Blocks
                    .Where(b => b.BlockedId == userId)
                    .Select(b => b.BlockerId)
                    .ToListAsync(cancellationToken);

                var excludedByBlock = blockedByMe.Union(blockedMe).ToHashSet();

                // 3. Exclude users already in an active (Pending or Accepted) match with current user
                var alreadyMatchedIds = await context.Matches
                    .Where(m =>
                        (m.User1Id == userId || m.User2Id == userId) &&
                        (m.Status == MatchStatus.Pending || m.Status == MatchStatus.Accepted))
                    .Select(m => m.User1Id == userId ? m.User2Id : m.User1Id)
                    .ToListAsync(cancellationToken);

                var excludedIds = new HashSet<Guid>(friendIds
                    .Concat(excludedByBlock)
                    .Concat(alreadyMatchedIds))
                {
                    userId   // also exclude self
                };

                // 4. Build candidate query, applying age filters when provided
                var candidatesQuery = context.UserNodes
                    .Where(u => !excludedIds.Contains(u.Id));

                if (command.Filters.MinAge.HasValue)
                    candidatesQuery = candidatesQuery.Where(u => u.Age >= command.Filters.MinAge.Value);

                if (command.Filters.MaxAge.HasValue)
                    candidatesQuery = candidatesQuery.Where(u => u.Age <= command.Filters.MaxAge.Value);

                // 5. Pick one at random
                var randomUserId = await candidatesQuery
                    .OrderBy(_ => Guid.NewGuid())
                    .Select(u => u.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (randomUserId == Guid.Empty)
                    throw new InvalidOperationException(
                        "No eligible users found for a random match with the given filters.");

                var match = new Match
                {
                    Type = MatchType.Random,
                    User1Id = userId,
                    User2Id = randomUserId,
                    Status = MatchStatus.Pending,
                };

                await context.Matches.AddAsync(match, cancellationToken);
                await context.SaveChangesAsync(cancellationToken);

                return mapper.Map<MatchDto>(match);
            }
        }
    }
}
