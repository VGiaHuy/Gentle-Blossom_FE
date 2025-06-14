namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class ChatRoomDTO
    {
        public int ChatRoomId { get; set; } 

        public string? ChatRoomName { get; set; }

        public bool IsGroup { get; set; }

        public string? ChatCode { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}
