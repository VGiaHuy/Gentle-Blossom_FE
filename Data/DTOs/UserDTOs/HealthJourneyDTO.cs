namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class HealthJourneyDTO
    {
        public int JourneyId { get; set; }

        public int TreatmentId { get; set; }

        public string? TreatmentName { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly? DueDate { get; set; }

        public DateOnly? EndDate { get; set; }

        public bool Status { get; set; }
    }
}
