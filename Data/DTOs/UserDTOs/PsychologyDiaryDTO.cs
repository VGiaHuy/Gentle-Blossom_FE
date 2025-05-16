namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class PsychologyDiaryDTO
    {
        public int DiaryId { get; set; }

        public int JourneyId { get; set; }

        public string UserName { get; set; }

        public string TreatmentName { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly? DueDate { get; set; }

        public DateOnly? EndDate { get; set; }

        public bool Status { get; set; }

        public DateOnly? CreatedDate { get; set; }

        public string Mood { get; set; } = null!;

        public string Content { get; set; } = null!;
    }
}
