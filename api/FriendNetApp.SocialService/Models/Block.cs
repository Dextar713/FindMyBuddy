using System.ComponentModel.DataAnnotations;

namespace FriendNetApp.SocialService.Models
{
    public class Block
    {
        [Required]
        public required Guid BlockerId { get; set; }
        [Required]
        public required Guid BlockedId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public UserNode? Blocker { get; set; }
        public UserNode? Blocked { get; set; }
    }
}
