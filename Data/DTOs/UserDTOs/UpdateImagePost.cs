namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class UpdateImagePost
    {
        public string PostId { get; set; }
        public List<IFormFile> MediaFiles { get; set; } = new();
    }
}
