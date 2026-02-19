using AutoMapper;
using FriendNetApp.SocialService.Data;
using FriendNetApp.SocialService.Dto;
using Microsoft.EntityFrameworkCore;

namespace FriendNetApp.SocialService.App.Blocks.Queries
{
    public class GetBlocks
    {
        public class Query
        {
            public required Guid BlockerId { get; set; }
        }

        public class Handler(SocialDbContext context, IMapper mapper)
        {
            public async Task<List<BlockDto>> Handle(Query query, CancellationToken cancellationToken)
            {
                var blocks = await context.Blocks
                    .Where(b => b.BlockerId == query.BlockerId)
                    .Include(b => b.Blocked)
                    .ToListAsync(cancellationToken);

                return mapper.Map<List<BlockDto>>(blocks);
            }
        }
    }
}
