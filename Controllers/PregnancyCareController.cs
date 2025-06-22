using Gentle_Blossom_FE.Data.Constants;
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
    public class PregnancyCareController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ApiSettings _apiSettings;

        public PregnancyCareController(IHttpClientFactory httpClientFactory, IOptions<ApiSettings> apiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _apiSettings = apiSettings.Value;
        }

        public IActionResult HealthJourney()
        {
            return View();
        }

        public IActionResult PsychologyDiary()
        {
            return View();
        }

        [HttpGet("PregnancyCare/ConnectPost/{postId}")]
        public async Task<IActionResult> ConnectPost(string postId)
        {
            int id = int.Parse(postId);

            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Post/GetPostById?postId={id}");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<PostDTO>>(rawJson);

                return View("ConnectPost", jsonData.Data);
            }

            var error = await response.Content.ReadAsStringAsync();
            return View("404");
        }

        [HttpPost]
        public async Task<IActionResult> ConnectMessage(int postId, int expertId)
        {
            ConnectMessageDTO connectMessage = new ConnectMessageDTO
            {
                PostId = postId,
                ExpertId = expertId
            };

            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/PregnancyCare/ConnectMessage", connectMessage);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson);

                return Json(new { success = true, message = jsonData.Message });
            }

            var error = await response.Content.ReadAsStringAsync();
            return View("/Shared/404");
        }

        [HttpGet]
        public async Task<IActionResult> GetHealthJourney(int chatRoomId)
        {
            int userId = 0;
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

            var client = _httpClientFactory.CreateClient();

            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/PregnancyCare/GetHealthJourney?chatRoomId={chatRoomId}&expertId={userId}");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<List<HealthJourneyDTO>>>(rawJson);

                return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Lấy dữ liệu không thành công! Lỗi: " + error });
        }

        [HttpGet]
        public async Task<IActionResult> GetDetailHealthJourney(int trackingId, int treatmentId)
        {
            var client = _httpClientFactory.CreateClient();

            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/PregnancyCare/GetDetailHealthJourney?trackingId={trackingId}&treatmentId={treatmentId}");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();

                if(treatmentId == Treatments.Periodic) 
                {
                    var jsonData = JsonConvert.DeserializeObject<API_Response<List<PeriodicHealthDTO>>>(rawJson);
                    return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
                }
                else if(treatmentId == Treatments.Psychology) 
                {
                    var jsonData = JsonConvert.DeserializeObject<API_Response<List<PsychologyDiaryDTO>>>(rawJson);
                    return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
                }
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Lấy dữ liệu không thành công! Lỗi: " + error });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllMonitoringFormByHeathId(int heathId)
        {
            var client = _httpClientFactory.CreateClient();

            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/PregnancyCare/GetAllMonitoringFormByHeathId?heathId={heathId}");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<List<MonitoringFormDTO>>>(rawJson);

                return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Lấy dữ liệu không thành công! Lỗi: " + error });
        }

        [HttpPost]
        public async Task<IActionResult> CreateHealthJourney([FromForm] CreateHealthJourneyDTO createHealth)
        {
            int userId = 0;
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
            createHealth.ExpertId = userId;

            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/PregnancyCare/CreateHealthJourney", createHealth);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<List<MonitoringFormDTO>>>(rawJson);

                return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Lấy dữ liệu không thành công! Lỗi: " + error });
        }

        [HttpPost]
        public async Task<IActionResult> CreateMonitoring([FromForm] CreateMonitoringDTO createMonitoring)
        {
            int userId = 0;
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
            createMonitoring.ExpertId = userId;

            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/PregnancyCare/CreateMonitoring", createMonitoring);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<List<MonitoringFormDTO>>>(rawJson);

                return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Lấy dữ liệu không thành công! Lỗi: " + error });
        }

        [HttpGet]
        public async Task<IActionResult> GetPeriodicDetails([FromQuery] int journeyId)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/PregnancyCare/GetPeriodicDetails?journeyId={journeyId}");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<List<PeriodicHealthDTO>>>(rawJson);

                return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Lấy dữ liệu không thành công! Lỗi: " + error });
        }

        [HttpGet]
        public async Task<IActionResult> GetPsychologyDiaryDetails([FromQuery] int journeyId)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/PregnancyCare/GetPsychologyDiaryDetails?journeyId={journeyId}");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<List<PsychologyDiaryDTO>>>(rawJson);

                return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Lấy dữ liệu không thành công! Lỗi: " + error });
        }

        [HttpPost]
        public async Task<IActionResult> CreatePeriodic(PeriodicHealthDTO periodicHealth)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/PregnancyCare/CreatePeriodic", periodicHealth);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson);

                return Json(new { success = true, message = jsonData.Message });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Thêm mới không thành công! Lỗi: " + error });
        }

        [HttpPost]
        public async Task<IActionResult> CreatePsychologyDiary(PsychologyDiaryDTO psychologyDiary)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/PregnancyCare/CreatePsychologyDiary", psychologyDiary);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson);

                return Json(new { success = true, message = jsonData.Message });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Thêm mới không thành công! Lỗi: " + error });
        }

        [HttpPost]
        public async Task<IActionResult> CompleteJourney(string journeyId)
        {
            int id = int.Parse(journeyId);
            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/PregnancyCare/CompleteJourney", id);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson);

                return Json(new { success = true, message = jsonData.Message });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Thực hiện không thành công! Lỗi: " + error });
        }
    }
}
