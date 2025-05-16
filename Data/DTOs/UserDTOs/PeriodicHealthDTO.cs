namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class PeriodicHealthDTO
    {
        public int HealthId { get; set; }

        public int JourneyId { get; set; }

        public string UserName { get; set; }

        public string TreatmentName { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly? DueDate { get; set; }

        public DateOnly? EndDate { get; set; }

        public bool Status { get; set; }

        public byte WeeksPregnant { get; set; }

        public byte? BloodPressure { get; set; }

        public decimal? WaistCircumference { get; set; }

        public decimal? Weight { get; set; }

        public string? Mood { get; set; }

        public bool? GenderBaby { get; set; }

        public string? Notes { get; set; }

        public DateOnly? CreatedDate { get; set; }
    }
}
