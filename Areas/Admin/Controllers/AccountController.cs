using Gentle_Blossom_FE.Areas.Admin.Data;
using Gentle_Blossom_FE.Data.Responses;
using Gentle_Blossom_FE.Data.Settings;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Security.Claims;

namespace Gentle_Blossom_FE.Areas.Admin.Controllers
{
    [Area("admin")]
    [Route("admin")]
    [Route("admin/account")]
    public class AccountController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;

        private readonly ApiSettings _apiSettings;

        public AccountController(IHttpClientFactory httpClientFactory, IOptions<ApiSettings> apiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _apiSettings = apiSettings.Value;
        }

        [Route("")]
        public ActionResult Index()
        {
            if (!User.Identity.IsAuthenticated)
                return RedirectToAction("Login");
            else
                return RedirectToAction("Index", "Home");
        }

        [Route("Login")]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        [Route("Login")]
        public async Task<IActionResult> Login(string username, string password)
        {
            var model = new { username, password };

            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.AdminApiBaseUrl}/Account/Login", model);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<LoginAdminResponse>>(rawJson)!;

                if (jsonData != null && jsonData.Success)
                {
                    var claims = new List<Claim>()
                    {
                        new Claim(ClaimTypes.Name, jsonData.Data.adminProfileDTO!.FullName),
                        new Claim(ClaimTypes.Role, jsonData.Data.adminProfileDTO.RoleName),
                        new Claim(ClaimTypes.NameIdentifier, jsonData.Data.adminProfileDTO.AdminId.ToString()),
                        new Claim("ProfileImageUrl", jsonData.Data.adminProfileDTO.AvatarUrl ?? string.Empty),
                        new Claim("JwtToken", jsonData.Data!.AccessToken!)
                    };

                    var claimsIdentity = new ClaimsIdentity(claims, "AdminCookie");
                    var claimsPrincial = new ClaimsPrincipal(claimsIdentity);

                    await HttpContext.SignInAsync("AdminCookie", claimsPrincial);

                    return RedirectToAction("Index", "Home");
                }
                else
                {
                    TempData["error"] = jsonData!.Message;
                    return View();
                }

            }
            else
            {
                var errorJson = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync())!;
                TempData["error"] = (string)errorJson.Message ?? "Đã xảy ra lỗi!";
                return View();
            }
        }

        [Route("Logout")]
        //[Authorize(AuthenticationSchemes = "AdminCookie")]
        public async Task<IActionResult> Logout()
        {
            // Xóa phiên đăng nhập
            await HttpContext.SignOutAsync("AdminCookie");

            return RedirectToAction("Login");
        }
    }
}
