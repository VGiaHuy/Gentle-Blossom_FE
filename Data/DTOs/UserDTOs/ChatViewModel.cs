using Gentle_Blossom_FE.Data.DTOs.UserDTOs;

namespace Gentle_Blossom_FE.Data.DTOs.UserDTOs
{
    public class ChatViewModel
    {
        public List<ChatRoomDTO> ChatRooms { get; set; } = new();
        public ChatRoomDTO? SelectedRoom { get; set; }
        public List<MessageDTO> Messages { get; set; } = new();
        public List<UserDTO> AvailableUsers { get; set; } = new();
        public int CurrentUserId { get; set; }
    }
}
