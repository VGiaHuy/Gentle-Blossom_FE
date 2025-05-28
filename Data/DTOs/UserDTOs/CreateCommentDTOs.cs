namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class CreateCommentDTOs
    {
        public int PostId { get; set; }
        public int PosterId { get; set; }
        public int? ParentCommentId { get; set; }
        public string Content { get; set; } = string.Empty;
        public IFormFile? MediaFile { get; set; }
    }
}
