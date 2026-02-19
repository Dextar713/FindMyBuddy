using System.ComponentModel.DataAnnotations;

namespace FriendNetApp.SocialService.Models
{
    public class UserNode
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required] [MaxLength(70)] [EmailAddress]
        public required string Email { get; set; }

        [MaxLength(50)]
        public string? UserName { get; set; }

        public int? Age { get; set; }
    }
}
