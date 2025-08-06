using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Responses;
using Gentle_Blossom_FE.Data.Settings;
using GentleBlossom_BE.Data.Responses;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Security.Claims;

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
            if (User.Identity!.IsAuthenticated)
            {
                return RedirectToAction("Index", "Home");
            }

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

        // GET: /Auth/GoogleLogin
        [HttpGet]
        public IActionResult GoogleLogin(string returnUrl = "/")
        {
            var properties = new AuthenticationProperties { RedirectUri = Url.Action("GoogleResponse", new { returnUrl }) };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        // GET: /Auth/GoogleResponse
        [HttpGet]
        public async Task<IActionResult> GoogleResponse(string returnUrl = "/")
        {
            var result = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            if (!result.Succeeded)
                return RedirectToAction("Login");

            var claimsResponse = result.Principal.Claims.ToList();
            var email = claimsResponse.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            var name = claimsResponse.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
            var avatar = claimsResponse.FirstOrDefault(c => c.Type == "picture")?.Value;
            var googleId = claimsResponse.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            LoginWithGoogle data = new LoginWithGoogle
            {
                email = email!,
                fullName = name!
            };

            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/UserAuth/CheckLoggedWithGoogle", data);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<LoginResponse>>(rawJson);

                if (jsonData.Success)
                {
                    var claims = new List<Claim>
                    {
                        new Claim(ClaimTypes.Name, name!),
                        new Claim(ClaimTypes.Role, "User"),
                        new Claim(ClaimTypes.NameIdentifier, jsonData.Data.userProfileDTO.UserId.ToString()),
                        new Claim("ProfileImageUrl", avatar!),
                        new Claim("JwtToken", jsonData.Data.AccessToken)
                    };

                    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                    var principal = new ClaimsPrincipal(identity);
                    await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, new AuthenticationProperties
                    {
                        IsPersistent = true, // Lưu cookie qua các phiên trình duyệt
                        ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(30) // Đồng bộ với thời gian hết hạn token
                    });

                    return Redirect(returnUrl);
                }
                else
                {
                    // Lưu thông tin từ claimsResponse vào TempData
                    TempData["GoogleEmail"] = email;
                    TempData["GoogleName"] = name;
                    TempData["GoogleId"] = googleId;
                    TempData["GoogleAvatar"] = avatar;

                    return View("CompleteProfile");
                }
            }
            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Cập nhật thông tin không thành công! Lỗi: " + error });
        }

        [HttpPost]
        public async Task<IActionResult> CompleteProfile(DateOnly dateOfBirth, string phoneNumber)
        {
            try
            {
                // Lấy thông tin từ TempData
                var email = TempData["GoogleEmail"]?.ToString();
                var name = TempData["GoogleName"]?.ToString();
                var avatar = TempData["GoogleAvatar"]?.ToString();
                var googleId = TempData["GoogleId"]?.ToString();

                var completeProfileData = new CompleteProfile
                {
                    Email = email,
                    FullName = name,
                    DateOfBirth = dateOfBirth,
                    PhoneNumber = phoneNumber,
                    GoogleId = googleId
                };

                var client = _httpClientFactory.CreateClient();
                var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/UserAuth/RegisterForLoginGoogle", completeProfileData);

                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<LoginResponse>>(rawJson);

                if (response.IsSuccessStatusCode)
                {
                    var claims = new List<Claim>
                   {
                        new Claim(ClaimTypes.Name, name!),
                        new Claim(ClaimTypes.Role, "User"),
                        new Claim(ClaimTypes.NameIdentifier, jsonData.Data.userProfileDTO.UserId.ToString()),
                        new Claim("ProfileImageUrl", avatar!),
                        new Claim("JwtToken", jsonData.Data.AccessToken)
                    };

                    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                    var principal = new ClaimsPrincipal(identity);
                    await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, new AuthenticationProperties
                    {
                        IsPersistent = true,
                        ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(30)
                    });

                    return Json(new { success = true, message = "Cập nhật thông tin thành công!" });
                }

                return Json(new { success = false, message = "Cập nhật thông tin không thành công: " + jsonData.Message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }

        public IActionResult Register()
        {
            if (User.Identity!.IsAuthenticated)
            {
                return RedirectToAction("Index", "Home");
            }

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
