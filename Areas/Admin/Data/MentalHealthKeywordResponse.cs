namespace Gentle_Blossom_FE.Areas.Admin.Data
{
    public class MentalHealthKeywordResponse
    {
        public List<MentalHealthKeywordDTO> Keywords { get; set; } = new List<MentalHealthKeywordDTO>();
        public int TotalCount { get; set; }
    }
}
