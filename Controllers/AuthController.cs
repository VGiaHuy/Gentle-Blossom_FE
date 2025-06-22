using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Settings;
using Gentle_Blossom_FE.Data.Responses;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using GentleBlossom_BE.Data.Responses;
using Newtonsoft.Json.Linq;

namespace Gentle_Blossom_FE.Controllers
{
    public class AuthController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        private readonly ApiSettings _apiSettings;

        public AuthController(IHttpClientFactory httpClientFactory, IOptions<ApiSettings> apiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _apiSettings = apiSettings.Value;
        }

        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Login(string username, string password)
        {
            try
            {
                var model = new { username, password };

                var client = _httpClientFactory.CreateClient();
                var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/UserAuth/Login", model);

                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<LoginResponse>>(rawJson)!;

                if (response.IsSuccessStatusCode)
                {
                    var claims = new List<Claim>
                        {
                            new Claim(ClaimTypes.Name, jsonData.Data.userProfileDTO.FullName),
                            new Claim(ClaimTypes.NameIdentifier, jsonData.Data.userProfileDTO.UserId.ToString()),
                            new Claim(ClaimTypes.Role, (jsonData.Data.userProfileDTO.UserTypeId == 3 ? "User" : "Expert") ),
                            new Claim("ProfileImageUrl", jsonData.Data.userProfileDTO.AvatarUrl ?? string.Empty),
                            new Claim("JwtToken", jsonData.Data.AccessToken!)
                        };

                    var claimIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                    var claimsPrincipal = new ClaimsPrincipal(claimIdentity);
                    await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, claimsPrincipal, new AuthenticationProperties
                    {
                        IsPersistent = true, // Lưu cookie qua các phiên trình duyệt
                        ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(30) // Đồng bộ với thời gian hết hạn token
                    });
                    return Json(new
                    {
                        success = true,
                        message = "Đăng nhập thành công!",
                        data = new
                        {
                            username = jsonData.Data.userProfileDTO.FullName,
                            redirectUrl = Url.Action("Index", "Home"),
                        }
                    });
                }

                return Json(new
                {
                    success = false,
                    message = jsonData?.Message ?? "Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.",
                    data = jsonData?.Data
                });
            }
            catch (HttpRequestException ex)
            {
                return Json(new { success = false, message = "Lỗi kết nối API: " + ex.Message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Có lỗi xảy ra: " + ex.Message });
            }
        }

        public IActionResult Register()
        {
            return View("Register");
        }

        [HttpPost]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/UserAuth/Register", model);

            var rawJson = await response.Content.ReadAsStringAsync();
            var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson);

            if (response.IsSuccessStatusCode)
            {
                return Json(new { success = true, message = "Đăng ký thành công!" });
            }

            return Json(new { success = false, message = "Đăng ký không thành công!" + jsonData.Message });
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Logout()
        {
            try
            {
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return RedirectToAction("Login");
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = $"Lỗi đăng xuất: {ex.Message}"
                });
            }
        }
    }
}
