using Gentle_Blossom_FE.Data.Settings;
using Gentle_Blossom_FE.Data.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Gentle_Blossom_FE.Data.DTOs.UserDTOs;

namespace Gentle_Blossom_FE.Controllers
{
    public class HomeController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ApiSettings _apiSettings;

        public HomeController(IHttpClientFactory httpClientFactory, IOptions<ApiSettings> apiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _apiSettings = apiSettings.Value;
        }

        public async Task<IActionResult> Index()
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Post/GetAllPost");

            var rawJson = await response.Content.ReadAsStringAsync();
            var jsonData = JsonConvert.DeserializeObject<API_Response<List<PostDTO>>>(rawJson);

            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("Index", jsonData!.Data);
            }

            return View("Index", jsonData!.Data);
        }


    }
}
