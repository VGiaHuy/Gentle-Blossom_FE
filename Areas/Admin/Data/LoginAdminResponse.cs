namespace Gentle_Blossom_FE.Areas.Admin.Data
{
    public class LoginAdminResponse
    {
        public AdminProfileDTO adminProfileDTO { get; set; } = new AdminProfileDTO();
        public string? AccessToken { get; set; }
        public int ExpiresIn { get; set; }
    }
}
