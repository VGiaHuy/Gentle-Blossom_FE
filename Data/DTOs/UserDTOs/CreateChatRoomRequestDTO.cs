namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class CreateChatRoomRequestDTO
    {
        public string? ChatRoomName { get; set; }
        public bool IsGroup { get; set; }
        public int userCreate { get; set; }
    }
}
