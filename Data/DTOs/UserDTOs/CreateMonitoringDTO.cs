namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class CreateMonitoringDTO
    {
        public int JourneyId { get; set; }

        public byte Status { get; set; }

        public string? Notes { get; set; }

        public int ExpertId { get; set; }
    }
}
