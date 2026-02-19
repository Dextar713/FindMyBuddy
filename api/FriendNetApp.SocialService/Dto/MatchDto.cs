using FriendNetApp.SocialService.Models;

namespace FriendNetApp.SocialService.Dto
{
    public class MatchDto
    {
        public required Guid Id { get; set; }
        public Models.MatchType Type { get; set; }
        public MatchStatus Status { get; set; }
        public required Guid User1Id { get; set; }
        public required Guid User2Id { get; set; }
        // InviterId intentionally omitted to keep the inviter anonymous
        public DateTime CreatedAt { get; set; }
        public bool User1Accepted { get; set; }
        public bool User2Accepted { get; set; }
        public string? User1UserName { get; set; }
        public string? User2UserName { get; set; }
    }
}
