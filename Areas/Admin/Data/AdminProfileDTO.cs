namespace Gentle_Blossom_FE.Areas.Admin.Data
{
    public class AdminProfileDTO
    {
        public int UserId { get; set; }

        public int AdminId { get; set; }

        public string FullName { get; set; } = null!;

        public DateOnly BirthDate { get; set; }

        public string PhoneNumber { get; set; } = null!;

        public string Email { get; set; } = null!;

        public string? AvatarUrl { get; set; }

        public string? AvatarType { get; set; }

        public string? AvatarFileName { get; set; }

        public bool Gender { get; set; }

        public string RoleName { get; set; } = null!;
    }
}
