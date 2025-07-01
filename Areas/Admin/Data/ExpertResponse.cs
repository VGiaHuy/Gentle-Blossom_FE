using Gentle_Blossom_FE.Data.DTOs.UserDTOs;

namespace Gentle_Blossom_FE.Areas.Admin.Data
{
    public class ExpertResponse
    {
        public List<ExpertProfileDTO> Experts { get; set; } = new List<ExpertProfileDTO>();
        public int TotalCount { get; set; }
    }
}
