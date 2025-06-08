using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Responses;
using Gentle_Blossom_FE.Data.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http;
using System.Security.Claims;

namespace Gentle_Blossom_FE.Controllers
{
    public class ChatController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        private readonly ApiSettings _apiSettings;

        public ChatController(IHttpClientFactory httpClientFactory, IOptions<ApiSettings> apiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _apiSettings = apiSettings.Value;
        }

        public async Task<IActionResult> Index()
        {
            // Lấy ID người dùng từ Claims
            int userId = 0;
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Chat/GetUserChatRooms?userId={userId}");

            var rawJson = await response.Content.ReadAsStringAsync();
            var jsonData = JsonConvert.DeserializeObject<API_Response<List<ChatRoomDTO>>>(rawJson);

            if (response.IsSuccessStatusCode)
            {
                return View("Index", jsonData.Data);
            }

            return View("Index");
        }

        [HttpPost]
        public async Task<IActionResult> CreateChatRoom([FromBody] CreateChatRoomRequestDTO request)
        {
            var client = _httpClientFactory.CreateClient();

            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/", request);
            var result = await response.Content.ReadFromJsonAsync<API_Response<ChatRoomDTO>>();

            return Json(result);
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromForm] SendMessageRequestDTO request)
        {
            var client = _httpClientFactory.CreateClient();

            var formData = new MultipartFormDataContent();
            formData.Add(new StringContent(request.ChatRoomId.ToString()), "ChatRoomId");
            formData.Add(new StringContent(request.SenderId.ToString()), "SenderId");

            if (!string.IsNullOrEmpty(request.Content))
                formData.Add(new StringContent(request.Content), "Content");

            if (request.Attachment != null)
            {
                var streamContent = new StreamContent(request.Attachment.OpenReadStream());
                streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(request.Attachment.ContentType);
                formData.Add(streamContent, "Attachment", request.Attachment.FileName);
            }

            var response = await client.PostAsync($"{_apiSettings.UserApiBaseUrl}/send", formData);
            var result = await response.Content.ReadFromJsonAsync<API_Response<object>>();
            return Json(result);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteMessage(int messageId)
        {
            var client = _httpClientFactory.CreateClient();

            var response = await client.DeleteAsync($"{_apiSettings.UserApiBaseUrl}/message/{messageId}");
            var result = await response.Content.ReadFromJsonAsync<API_Response<object>>();
            return Json(result);
        }
    }
}
