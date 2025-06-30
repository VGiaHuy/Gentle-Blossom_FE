namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class UpdatePostDTO
    {
        public int PostId { get; set; }
        public string Content { get; set; } = string.Empty;
        public List<IFormFile>? NewMedias { get; set; }
        public List<string>? RemovedMediaUrls { get; set; }
    }

}
