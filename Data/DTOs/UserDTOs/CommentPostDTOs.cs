namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class CommentPostDTOs
    {
        public int CommentId { get; set; }

        public int PostId { get; set; }

        public int PosterId { get; set; }

        public string FullName { get; set; } = null!;

        public int? ParentCommentId { get; set; }

        public string Content { get; set; } = null!;

        public string? MediaUrl { get; set; }

        public string? MediaType { get; set; }

        public string? FileName { get; set; }

        public DateOnly? CommentDate { get; set; }
    }
}
