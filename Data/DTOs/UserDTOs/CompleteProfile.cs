namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class CompleteProfile
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public DateOnly DateOfBirth { get; set; }
        public string PhoneNumber { get; set; }
        public string GoogleId { get; set; }
    }
}
