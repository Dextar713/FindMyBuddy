namespace FriendNetApp.SocialService.Dto
{
    public class BlockDto
    {
        public required Guid BlockerId { get; set; }
        public required Guid BlockedId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
