namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class NotificationResponseDTO
    {
        public List<NotificationDTO> Notifications { get; set; } = new List<NotificationDTO>();
        public int TotalCount { get; set; }
    }
}
