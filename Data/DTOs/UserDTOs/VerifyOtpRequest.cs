namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class VerifyOtpRequest
    {
        public string OtpToken { get; set; }
        public string Email { get; set; }
        public string Otp { get; set; }
    }
}
