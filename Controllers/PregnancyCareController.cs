using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Responses;
using Gentle_Blossom_FE.Data.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http;

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
            return View("/Shared/404");
        }
    }
}
