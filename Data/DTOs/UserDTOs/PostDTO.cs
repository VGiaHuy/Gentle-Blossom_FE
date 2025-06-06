namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class PostDTO
    {
        public int PostId { get; set; }

        public string PosterName { get; set; }

        public AvatarMediaDTO? PosterAvatar { get; set; }

        public string PosterType { get; set; }

        public string AcademicTitle { get; set; }

        public string CategoryName { get; set; }

        public string Content { get; set; } = null!;

        public DateOnly? CreatedDate { get; set; }

        public int NumberOfLike { get; set; }

        public bool Liked { get; set; }

        public int NumberOfComment { get; set; }
        public List<PostMediaDTO> MediaList { get; set; } = new();

    }

    public class PostMediaDTO
    {
        public string MediaUrl { get; set; } = null!;
        public string MediaType { get; set; } = null!; // "image", "video", ...
        public string? FileName { get; set; }
        public string? MediaData { get; set; }
    }

    public class AvatarMediaDTO
    {
        public string AvatarUrl { get; set; } = null!;
        public string AvatarType { get; set; } = null!; // "image", "video", ...
        public string? AvatarFileName { get; set; }
    }
}
