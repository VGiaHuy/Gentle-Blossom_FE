namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class CreatePostDTO
    {
        public string UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public List<IFormFile> MediaFiles { get; set; } = new();
    }
}
