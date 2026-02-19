using FriendNetApp.Contracts.Events;
using FriendNetApp.MessagingService.Data;
using FriendNetApp.MessagingService.Models;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace FriendNetApp.MessagingService.Dto.Events
{
    public class MatchAcceptedEventConsumer : IConsumer<MatchAcceptedEvent>
    {
        private readonly MessagingDbContext _db;

        public MatchAcceptedEventConsumer(MessagingDbContext db)
        {
            _db = db;
        }

        public async Task Consume(ConsumeContext<MatchAcceptedEvent> context)
        {
            var message = context.Message;

            // Idempotency: skip if chat already exists for this pair
            var chatExists = await _db.Chats.AnyAsync(c =>
                (c.User1Id == message.User1Id && c.User2Id == message.User2Id) ||
                (c.User1Id == message.User2Id && c.User2Id == message.User1Id));

            if (chatExists)
                return;

            // Both users must have replicas; if not yet replicated, skip gracefully
            var user1 = await _db.UserReplicas.FindAsync(message.User1Id);
            var user2 = await _db.UserReplicas.FindAsync(message.User2Id);

            if (user1 == null || user2 == null)
                return;

            _db.Chats.Add(new Chat
            {
                User1Id = message.User1Id,
                User2Id = message.User2Id,
            });

            await _db.SaveChangesAsync();
        }
    }
}
