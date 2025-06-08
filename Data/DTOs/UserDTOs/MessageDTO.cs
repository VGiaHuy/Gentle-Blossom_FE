namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class MessageDTO
    {
        public int MessageId { get; set; }

        public int ChatRoomId { get; set; }

        public int SenderId { get; set; }

        public string? Content { get; set; }

        public string? AttachmentUrl { get; set; }

        public string? AttachmentType { get; set; } = "";

        public DateTime SentAt { get; set; }

        public bool? IsDeleted { get; set; }

        public bool IsOutgoing { get; set; }    // true nếu tin nhắn do người dùng hiện tại gửi, false nếu nhận được từ người khác
    }
}
