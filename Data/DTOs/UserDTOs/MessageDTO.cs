namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class MessageDTO
    {
        public int MessageId { get; set; }

        public int ChatRoomId { get; set; }

        public int SenderId { get; set; }

        public string? SenderName { get; set; }

        public string? AvatarUrl { get; set; }

        public string? Content { get; set; }

        public List<MessageMediaDTO> MediaList { get; set; } = new();

        public DateTime SentAt { get; set; }

        public bool? IsDeleted { get; set; }

        public bool IsOutgoing { get; set; }
    }

    public class MessageMediaDTO
    {
        public string MediaUrl { get; set; } = null!;

        public string MediaType { get; set; } = null!;

        public string? FileName { get; set; }

        public long? FileSize { get; set; } // Byte

        public string? ThumbnailUrl { get; set; } // URL hình thu nhỏ
    }
}
