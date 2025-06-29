using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Responses;
using Gentle_Blossom_FE.Data.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http;
using System.Security.Claims;

namespace Gentle_Blossom_FE.Controllers
{
    public class FriendsController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ApiSettings _apiSettings;

        public FriendsController(IHttpClientFactory httpClientFactory, IOptions<ApiSettings> apiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _apiSettings = apiSettings.Value;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetAllExperts()
        {
            var client = _httpClientFactory.CreateClient();

            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Friends/GetAllExperts");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<List<ExpertProfileDTO>>>(rawJson);

                return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
            }

            var errorJson = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync())!;
            return Json(new { success = false, message = (string)errorJson.Message ?? "Đã xảy ra lỗi!" });
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromQuery] int expertId)
        {
            int userId = 0;
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

            var request = new {
                ExpertId = expertId,
                UserId = userId
            };

            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/Friends/SendMessage", request);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<int>>(rawJson);

                return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
            }

            var errorJson = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync())!;
            return Json(new { success = false, message = (string)errorJson.Message ?? "Đã xảy ra lỗi!" });
        }

        [HttpGet]
        public async Task<IActionResult> GetExpertById([FromQuery] int expertId)
        {
            var client = _httpClientFactory.CreateClient();

            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Friends/GetExpertById?expertId={expertId}");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<ExpertProfileDTO>>(rawJson);

                return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
            }

            var errorJson = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync())!;
            return Json(new { success = false, message = (string)errorJson.Message ?? "Đã xảy ra lỗi!" });
        }
    }
}
