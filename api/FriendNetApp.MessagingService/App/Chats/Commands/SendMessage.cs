using AutoMapper;
using FriendNetApp.MessagingService.Data;
using FriendNetApp.MessagingService.Dto;
using FriendNetApp.MessagingService.Models;

namespace FriendNetApp.MessagingService.App.Chats.Commands
{
    public class SendMessage
    {
        public class Command
        {
            public required MessageDto Message { get; set; }
        }

        public class Handler(MessagingDbContext context, IMapper mapper)
        {
            public async Task<string> Handle(Command command,
                CancellationToken cancellationToken)
            {
                Message msg = mapper.Map<Message>(command.Message);
                await context.Messages.AddAsync(msg, cancellationToken);
                await context.SaveChangesAsync(cancellationToken);
                return msg.Id.ToString();
            }
        }
    }
}
