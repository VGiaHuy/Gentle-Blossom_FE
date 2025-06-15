using Gentle_Blossom_FE.Data.DTOs.UserDTOs;

namespace GentleBlossom_BE.Data.Responses
{
    public class LoginResponse
    {
        public UserProfileDTO userProfileDTO { get; set; } = new UserProfileDTO();
        public string? AccessToken { get; set; }
        public int ExpiresIn { get; set; }
    }
}
