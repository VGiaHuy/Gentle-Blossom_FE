using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Settings;
using Gentle_Blossom_FE.Data.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Security.Claims;
using Gentle_Blossom_FE.Data.Responses;

namespace Gentle_Blossom_FE.Controllers
{
    public class UserProfileController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ApiSettings _apiSettings;

        public UserProfileController(IHttpClientFactory httpClientFactory, IOptions<ApiSettings> apiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _apiSettings = apiSettings.Value;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userId = int.Parse(userIdString);

                var userProfileResponse = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/UserProfile/GetUserProfile?id={userId}");
                var userProfileRawJson = await userProfileResponse.Content.ReadAsStringAsync();
                var userProfile = JsonConvert.DeserializeObject<API_Response<UserProfileViewModel>>(userProfileRawJson);

                var viewModal = new UserProfileViewModel();
                viewModal.UserProfile = userProfile.Data.UserProfile!;
                viewModal.PsychologyDiaries = userProfile.Data!.PsychologyDiaries.OrderByDescending(a => a.DiaryId).ToList();
                viewModal.PeriodicHealths = userProfile.Data!.PeriodicHealths.OrderByDescending(a => a.HealthId).ToList();

                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return PartialView("Index", viewModal);
                }
                return View(viewModal);
            }
            catch (Exception ex)
            {
                return View("Error", ex.Message);
            }

        }
    }
}
