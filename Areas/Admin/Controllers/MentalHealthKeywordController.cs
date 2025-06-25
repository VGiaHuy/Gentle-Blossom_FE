using Gentle_Blossom_FE.Areas.Admin.Data;
using Gentle_Blossom_FE.Data.Responses;
using Gentle_Blossom_FE.Data.Settings;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Reflection;
using System.Security.Claims;

namespace Gentle_Blossom_FE.Areas.Admin.Controllers
{
    [Area("admin")]
    [Route("admin/MentalHealthKeyword")]
    public class MentalHealthKeywordController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ApiSettings _apiSettings;

        public MentalHealthKeywordController(IHttpClientFactory httpClientFactory, IOptions<ApiSettings> apiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _apiSettings = apiSettings.Value;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        [Route("GetKeyword")]
        public async Task<IActionResult> GetKeyword(int page, int pageSize)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{_apiSettings.AdminApiBaseUrl}/MentalHealthKeywords/GetAllMentalHealthKeyword?page={page}&pageSize={pageSize}");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<MentalHealthKeywordResponse>>(rawJson)!;

                if (jsonData != null && jsonData.Success)
                {
                    return Json(new {success = true, message = jsonData.Message, data = jsonData.Data});
                }
                else
                {
                    return Json(new { success = false, message = jsonData.Message, data = jsonData.Data });
                }
            }
            else
            {
                var errorJson = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync())!;
                return Json(new { success = false, message = (string)errorJson.Message ?? "Đã xảy ra lỗi!" });
            }
        }

        [HttpPost]
        [Route("AddKeyword")]
        public async Task<IActionResult> AddKeyword(MentalHealthKeywordDTO mentalHealthKeyword)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.AdminApiBaseUrl}/MentalHealthKeywords/AddMentalHealthKeyword", mentalHealthKeyword);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson)!;

                if (jsonData != null && jsonData.Success)
                {
                    return Json(new { success = true, message = jsonData.Message });
                }
                else
                {
                    return Json(new { success = false, message = jsonData.Message });
                }
            }
            else
            {
                var errorJson = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync())!;
                return Json(new { success = false, message = (string)errorJson.Message ?? "Đã xảy ra lỗi!" });
            }
        }

        [HttpDelete]
        [Route("DeleteKeyword")]
        public async Task<IActionResult> DeleteKeyword(int keywordId)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.DeleteAsync($"{_apiSettings.AdminApiBaseUrl}/MentalHealthKeywords/DeleteMentalHealthKeyword?keywordId={keywordId}");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson)!;

                if (jsonData != null && jsonData.Success)
                {
                    return Json(new { success = true, message = jsonData.Message });
                }
                else
                {
                    return Json(new { success = false, message = jsonData.Message });
                }
            }
            else
            {
                var errorJson = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync())!;
                return Json(new { success = false, message = (string)errorJson.Message ?? "Đã xảy ra lỗi!" });
            }
        }

        [Route("UpdateKeyword")]
        [HttpPost]
        public async Task<IActionResult> UpdateKeyword(MentalHealthKeywordDTO mentalHealthKeyword)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsJsonAsync($"{_apiSettings.AdminApiBaseUrl}/MentalHealthKeywords/UpdateMentalHealthKeyword", mentalHealthKeyword);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson)!;

                if (jsonData != null && jsonData.Success)
                {
                    return Json(new { success = true, message = jsonData.Message });
                }
                else
                {
                    return Json(new { success = false, message = jsonData.Message });
                }
            }
            else
            {
                var errorJson = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync())!;
                return Json(new { success = false, message = (string)errorJson.Message ?? "Đã xảy ra lỗi!" });
            }
        }
    }
}
