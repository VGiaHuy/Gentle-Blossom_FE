namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class UserProfileViewModel
    {
        public UserProfileDTO UserProfile { get; set; }
        public List<PsychologyDiaryDTO>? PsychologyDiaries { get; set; }
        public List<PeriodicHealthDTO>? PeriodicHealths { get; set; }
    }
}
