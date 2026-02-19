using AutoMapper;
using FriendNetApp.SocialService.Models;

namespace FriendNetApp.SocialService.Dto
{
    public class AutoMapperProfile: Profile
    {
        public AutoMapperProfile()
        {
            CreateMap<Match, MatchDto>()
                .ForMember(dest => dest.User1UserName, opt => opt.MapFrom(src => src.User1 != null ? src.User1.UserName : null))
                .ForMember(dest => dest.User2UserName, opt => opt.MapFrom(src => src.User2 != null ? src.User2.UserName : null));
            CreateMap<MatchDto, Match>()
                .ForMember(dest => dest.InviterId, opt => opt.Ignore())
                .ForMember(dest => dest.User1, opt => opt.Ignore())
                .ForMember(dest => dest.User2, opt => opt.Ignore())
                .ForMember(dest => dest.Inviter, opt => opt.Ignore());
            CreateMap<FriendshipDto, Friendship>().ReverseMap();
            CreateMap<Block, BlockDto>().ReverseMap();
        }
    }
}
