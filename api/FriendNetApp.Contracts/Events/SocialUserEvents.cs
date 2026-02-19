namespace FriendNetApp.Contracts.Events
{
    public record SocialUserCreatedEvent
    (
        Guid Id,
        string Email,
        string UserName,
        int? Age,
        string Description
    );

    public record SocialUserUpdatedEvent
    (
        Guid Id,
        string Email,
        string UserName,
        int? Age,
        string Description
    );
}
