﻿using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Responses;
using Gentle_Blossom_FE.Data.Settings;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http;
using System.Net.Http.Headers;
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

        [HttpGet]
        public async Task<IActionResult> Index(int? chatRoomId)
        {
            int userId = 0;
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

            var model = new ChatViewModel { CurrentUserId = userId };

            // Lấy token từ Claims
            var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
            if (string.IsNullOrEmpty(token))
            {
                await HttpContext.SignOutAsync();
                return RedirectToAction("Login", "Auth");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // Lấy danh sách phòng chat của người dùng
            var roomsResponse = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Chat/GetUserChatRooms?userId={userId}");
            var rawJson = await roomsResponse.Content.ReadAsStringAsync();
            var roomsResult = JsonConvert.DeserializeObject<API_Response<List<ChatRoomDTO>>>(rawJson);

            model.ChatRooms = roomsResult?.Success == true ? roomsResult.Data ?? new() : new();
            ViewData["ApiSettings"] = _apiSettings; // Truyền ApiSettings vào View

            // Nếu có chatRoomId, lấy thông tin phòng và tin nhắn
            if (chatRoomId.HasValue)
            {
                var roomResponse = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Chat/GetChatRoom?chatRoomId={chatRoomId.Value}");
                var roomResult = await roomResponse.Content.ReadFromJsonAsync<API_Response<ChatRoomDTO>>();
                if (roomResult?.Success == true)
                {
                    model.SelectedRoom = roomResult.Data;
                    var messagesResponse = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Chat/GetMessages?chatRoomId={chatRoomId.Value}");
                    var messagesResult = await messagesResponse.Content.ReadFromJsonAsync<API_Response<List<MessageDTO>>>();
                    model.Messages = messagesResult?.Data?.Select(m =>
                    {
                        m.IsOutgoing = m.SenderId == userId;
                        return m;
                    }).ToList() ?? new();
                }
            }

            return View(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetChatWindow(int chatRoomId)
        {
            int userId = 0;
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

            var model = new ChatViewModel { CurrentUserId = userId };

            // Lấy token từ Claims
            var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
            if (string.IsNullOrEmpty(token))
            {
                await HttpContext.SignOutAsync();
                return RedirectToAction("Login", "Auth");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var roomResponse = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Chat/GetChatRoom?chatRoomId={chatRoomId}");
            var roomResult = await roomResponse.Content.ReadFromJsonAsync<API_Response<ChatRoomDTO>>();

            if (roomResult?.Success == true)
            {
                model.SelectedRoom = roomResult.Data;

                var messagesResponse = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Chat/GetMessages?chatRoomId={chatRoomId}"); 
                var messagesResult = await messagesResponse.Content.ReadFromJsonAsync<API_Response<List<MessageDTO>>>();

                model.Messages = messagesResult?.Data?.Select(m =>
                {
                    m.IsOutgoing = m.SenderId == userId;
                    return m;
                }).ToList() ?? new();
            }

            return PartialView("Component/ChatWindow", model);
        }

        [HttpPost]
        public async Task<IActionResult> CreateChatRoom([FromBody] CreateChatRoomRequestDTO request)
        {
            // Lấy token từ Claims
            var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
            if (string.IsNullOrEmpty(token))
            {
                await HttpContext.SignOutAsync();
                return RedirectToAction("Login", "Auth");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/Chat/CreateChatRoom", request);
            var result = await response.Content.ReadFromJsonAsync<API_Response<ChatRoomDTO>>();

            return Json(result);
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromForm] SendMessageRequestDTO request)
        {
            try
            {
                if (request.ChatRoomId <= 0 || request.SenderId <= 0)
                {
                    return Json(new
                    {
                        Success = false,
                        Message = "ID phòng chat hoặc người gửi không hợp lệ"
                    });
                }

                // Tạo FormData để gửi tới backend API
                var formData = new MultipartFormDataContent();
                formData.Add(new StringContent(request.ChatRoomId.ToString()), "ChatRoomId");
                formData.Add(new StringContent(request.SenderId.ToString()), "SenderId");
                if (!string.IsNullOrEmpty(request.Content))
                    formData.Add(new StringContent(request.Content), "Content");

                if (request.Attachments != null && request.Attachments.Any())
                {
                    foreach (var file in request.Attachments)
                    {
                        if (file.Length > 0)
                        {
                            var streamContent = new StreamContent(file.OpenReadStream());
                            streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
                            formData.Add(streamContent, "Attachments", file.FileName);
                        }
                    }
                }

                // Gửi yêu cầu tới backend API
                // Lấy token từ Claims
                var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
                if (string.IsNullOrEmpty(token))
                {
                    await HttpContext.SignOutAsync();
                    return RedirectToAction("Login", "Auth");
                }

                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                var response = await client.PostAsync($"{_apiSettings.UserApiBaseUrl}/Chat/SendMessage", formData);
                var result = await response.Content.ReadFromJsonAsync<API_Response<object>>();

                if (result.Success)
                {
                    return Json(new API_Response<object>
                    {
                        Success = true,
                    });
                }

                return Json(new API_Response<object>
                {
                    Success = false,
                    Message = result.Message ?? "Lỗi khi gửi tin nhắn tới backend"
                });
            }
            catch (Exception ex)
            {
                return Json(new API_Response<object>
                {
                    Success = false,
                    Message = $"Lỗi server: {ex.Message}"
                });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteMessage(int messageId, int chatRoomId)
        {
            // Lấy token từ Claims
            var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
            if (string.IsNullOrEmpty(token))
            {
                await HttpContext.SignOutAsync();
                return RedirectToAction("Login", "Auth");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var response = await client.DeleteAsync($"{_apiSettings.UserApiBaseUrl}/Chat/DeleteMessage?messageId={messageId}&chatRoomId={chatRoomId}");
            var result = await response.Content.ReadFromJsonAsync<API_Response<object>>();

            return Json(result);
        }

        [HttpPost]
        public async Task<IActionResult> JoinChatRoom(string chatCode)
        {
            int userId = 0;
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

            JoinChatRoomDTO data = new()
            {
                ChatCode = chatCode,
                UserId = userId
            };

            // Lấy token từ Claims
            var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
            if (string.IsNullOrEmpty(token))
            {
                await HttpContext.SignOutAsync();
                return RedirectToAction("Login", "Auth");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/Chat/JoinChatRoom", data);
            var result = await response.Content.ReadFromJsonAsync<API_Response<object>>();

            return Json(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetUsersInChatRoom([FromQuery] int chatRoomId)
        {
            // Lấy token từ Claims
            var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
            if (string.IsNullOrEmpty(token))
            {
                await HttpContext.SignOutAsync();
                return RedirectToAction("Login", "Auth");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var roomResponse = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Chat/GetUsersInChatRoom?chatRoomId={chatRoomId}");

            if (roomResponse.IsSuccessStatusCode)
            {
                var roomResult = await roomResponse.Content.ReadFromJsonAsync<API_Response<List<UsersInChatRoomDTO>>>();

                return Json(new { success = true, message = "Lấy dữ liệu thành công!", data = roomResult.Data });
            }
            return Json(new { success = false, message = "Lấy dữ liệu không thành công!" });
        }
    }
}
