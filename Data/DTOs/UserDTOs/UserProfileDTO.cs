namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class UserProfileDTO
    {
        public int UserId { get; set; }

        public string FullName { get; set; } = null!;

        public DateOnly BirthDate { get; set; }

        public string PhoneNumber { get; set; } = null!;

        public string Email { get; set; } = null!;

        public string? AvatarUrl { get; set; }

        public string? AvatarType { get; set; }

        public string? AvatarFileName { get; set; }

        public bool Gender { get; set; }

        public byte UserTypeId { get; set; }

        public int ExpertId { get; set; }

        public string AcademicTitle { get; set; } = null!;

        public string Position { get; set; } = null!;

        public string Specialization { get; set; } = null!;

        public string Organization { get; set; } = null!;
    }
}
