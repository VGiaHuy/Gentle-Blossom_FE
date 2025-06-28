namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class CreateHealthJourneyDTO
    {
        public int TreatmentId { get; set; }

        public string? JourneyName { get; set; }

        public DateOnly? DueDate { get; set; }

        public byte MonitoringStatus { get; set; }

        public string? MonitoringNote { get; set; }

        public int ChatRoomId { get; set; }

        public int ExpertId { get; set; }
    }
}
