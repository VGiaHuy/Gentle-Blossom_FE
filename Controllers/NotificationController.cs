using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Responses;
using Gentle_Blossom_FE.Data.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Security.Claims;

namespace Gentle_Blossom_FE.Controllers
{
    public class NotificationController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        private readonly ApiSettings _apiSettings;

        public NotificationController(IHttpClientFactory httpClientFactory, IOptions<ApiSettings> apiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _apiSettings = apiSettings.Value;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotification(int userId, int page = 1, int pageSize = 20)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Notification/GetNotification?userId={userId}&page={page}&pageSize={pageSize}");

            var rawJson = await response.Content.ReadAsStringAsync();
            var jsonData = JsonConvert.DeserializeObject<API_Response<NotificationResponseDTO>>(rawJson);

            if (response.IsSuccessStatusCode)
            {
                return Json(new { success = true, message = "Lấy dữ liệu thành công!", data = jsonData.Data });
            }

            return Json(new { success = false, message = "Lấy dữ liệu không thành công!" });
        }
    }
}
