namespace Gentle_Blossom_FE.Areas.Admin.Data
{
    public class MentalHealthKeywordDTO
    {
        public int KeywordId { get; set; }

        public string Keyword { get; set; } = null!;

        public string Category { get; set; } = null!;

        public int Weight { get; set; }

        public string SeverityLevel { get; set; } = null!;

        public bool IsActive { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
