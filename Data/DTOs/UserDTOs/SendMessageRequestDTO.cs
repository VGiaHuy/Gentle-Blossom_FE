namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class SendMessageRequestDTO
    {
        public int ChatRoomId { get; set; }
        public int SenderId { get; set; }
        public string? Content { get; set; }
        public List<IFormFile>? Attachments { get; set; }
    }
}
