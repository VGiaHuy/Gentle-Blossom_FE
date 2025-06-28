namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class CreateNewJourneyWithDataDTO
    {
        public int UserId { get; set; }

        public int TreatmentId { get; set; }

        public string? JourneyName { get; set; }

        public DateOnly? DueDate { get; set; }

        public byte WeeksPregnant { get; set; }

        public byte? BloodPressure { get; set; }

        public decimal? WaistCircumference { get; set; }

        public decimal? Weight { get; set; }

        public string? MoodPeriodicHealth { get; set; }

        public bool? GenderBaby { get; set; }

        public string? Notes { get; set; }

        public string MoodPsychologyDiary { get; set; } = null!;

        public string Content { get; set; } = null!;
    }
}
