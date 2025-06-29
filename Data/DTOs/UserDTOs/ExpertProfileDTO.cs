namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class ExpertProfileDTO
    {
        public int ExpertId { get; set; }

        public string FullName { get; set; } = null!;

        public bool Gender { get; set; }

        public string? AvatarUrl { get; set; }

        public string AcademicTitle { get; set; } = null!;

        public string Position { get; set; } = null!;

        public string Specialization { get; set; } = null!;

        public string Organization { get; set; } = null!;

        public string? Description { get; set; }
    }
}
