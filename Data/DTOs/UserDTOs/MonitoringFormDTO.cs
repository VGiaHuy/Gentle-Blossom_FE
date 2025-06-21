namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class MonitoringFormDTO
    {
        public int FormId { get; set; }

        public int ExpertId { get; set; }

        public int JourneyId { get; set; }

        public byte Status { get; set; }

        public string? Notes { get; set; }

        public DateOnly? CreatedDate { get; set; }

        public string ExpertName { get; set; }

        public string? ExpertAcademicTitle { get; set; }
    }
}
