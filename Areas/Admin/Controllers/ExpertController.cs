using Gentle_Blossom_FE.Areas.Admin.Data;
using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Responses;
using Gentle_Blossom_FE.Data.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace Gentle_Blossom_FE.Areas.Admin.Controllers
{
    [Area("admin")]
    [Route("admin/Expert")]
    public class ExpertController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ApiSettings _apiSettings;

        public ExpertController(IHttpClientFactory httpClientFactory, IOptions<ApiSettings> apiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _apiSettings = apiSettings.Value;
        }

        public IActionResult Index()
        {
            return View();
        }
        
        [HttpGet]
        [Route("GetExperts")]
        public async Task<IActionResult> GetExperts(int page, int pageSize)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{_apiSettings.AdminApiBaseUrl}/Expert/GetExperts?page={page}&pageSize={pageSize}");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<ExpertResponse>>(rawJson)!;

                if (jsonData != null && jsonData.Success)
                {
                    return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
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

        [HttpDelete]
        [Route("DeleteExpert")]
        public async Task<IActionResult> DeleteExpert(int expertId)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.DeleteAsync($"{_apiSettings.AdminApiBaseUrl}/Expert/DeleteExpert?expertId={expertId}");

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
