namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class NotificationDTO
    {
        public int NotificationId { get; set; }

        public int UserId { get; set; }

        public string Content { get; set; } = null!;

        public DateTime? CreateAt { get; set; }

        public bool? IsSeen { get; set; }

        public string Url { get; set; } = null!;

    }
}
