using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Settings;
using Gentle_Blossom_FE.Data.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Security.Claims;
using Gentle_Blossom_FE.Data.Responses;
using System.Reflection;
using Microsoft.AspNetCore.Authentication;
using System.Net.Http.Headers;

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
                // Lấy token từ Claims
                var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
                if (string.IsNullOrEmpty(token))
                {
                    await HttpContext.SignOutAsync();
                    return RedirectToAction("Login", "Auth");
                }

                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userId = int.Parse(userIdString);

                var userProfileResponse = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/UserProfile/GetUserProfile?id={userId}");
                var userProfileRawJson = await userProfileResponse.Content.ReadAsStringAsync();
                var userProfile = JsonConvert.DeserializeObject<API_Response<UserProfileViewModel>>(userProfileRawJson);

                var viewModal = new UserProfileViewModel();
                viewModal.UserProfile = userProfile.Data.UserProfile;
                viewModal.HealthJourneys = userProfile.Data.HealthJourneys;

                return View(viewModal);
            }
            catch (Exception ex)
            {
                return View("Error", ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateUserProfile([FromForm] UpdateUserProfileDTO userProfile)
        {
            try
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
                
                using var formData = new MultipartFormDataContent();

                formData.Add(new StringContent(userProfile.UserId.ToString()), "UserId");
                formData.Add(new StringContent(userProfile.FullName.ToString()), "FullName");
                formData.Add(new StringContent(userProfile.PhoneNumber.ToString()), "PhoneNumber");
                formData.Add(new StringContent(userProfile.Email.ToString()), "Email");
                formData.Add(new StringContent(userProfile.BirthDate.ToString("yyyy-MM-dd")), "BirthDate");
                formData.Add(new StringContent(userProfile.UserTypeId.ToString()), "UserTypeId");
                formData.Add(new StringContent(userProfile.Gender.ToString()), "Gender");

                if (userProfile.Avatar != null && userProfile.Avatar.Length > 0)
                {
                    // Thêm file nếu có
                    if (userProfile.Avatar != null && userProfile.Avatar.Length > 0)
                    {
                        // Kiểm tra định dạng file
                        var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm" };
                        if (!allowedContentTypes.Contains(userProfile.Avatar.ContentType))
                        {
                            return Json(new { success = false, message = "File không hợp lệ. Chỉ chấp nhận hình ảnh (JPEG, PNG, GIF) hoặc video (MP4, WebM)." });
                        }

                        var fileContent = new StreamContent(userProfile.Avatar.OpenReadStream());
                        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(userProfile.Avatar.ContentType);
                        formData.Add(fileContent, "Avatar", userProfile.Avatar.FileName);
                    }
                }

                var response = await client.PostAsync($"{_apiSettings.UserApiBaseUrl}/UserProfile/UpdateUserProfile", formData);

                if (response.IsSuccessStatusCode)
                {
                    return Json(new { success = true, message = "Cập nhật thông tin thành công!" });
                }

                var error = await response.Content.ReadAsStringAsync();
                return Json(new { success = false, message = "Cập nhật thông tin không thành công! Lỗi: " + error });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã có lỗi xảy ra: " + ex.Message });
            }
        }
    }
}
