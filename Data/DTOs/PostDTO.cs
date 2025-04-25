namespace Gentle_Blossom_FE.Data.DTOs
{
    public class PostDTO
    {
        public int PostId { get; set; }

        public string PosterName { get; set; }

        public string? PosterAvatar { get; set; }

        public string PosterType { get; set; }

        public string AcademicTitle { get; set; }

        public string CategoryName { get; set; }

        public string Content { get; set; } = null!;

        public DateOnly? CreatedDate { get; set; }

        public int NumberOfLike { get; set; }

        public int NumberOfComment { get; set; }
    }
}
