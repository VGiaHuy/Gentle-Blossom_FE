using Gentle_Blossom_FE.Areas.Admin.Data;
using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Responses;
using Gentle_Blossom_FE.Data.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

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

        [HttpPost]
        [Route("ImportExcel")]
        public async Task<IActionResult> ImportExcel([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { Message = "File không hợp lệ hoặc bị trống." });
            }

            // Kiểm tra định dạng tệp
            var allowedExtensions = new[] { ".xlsx", ".xls" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { Message = "Chỉ chấp nhận file Excel với định dạng .xlsx hoặc .xls." });
            }

            try
            {
                using (var stream = new MemoryStream())
                {
                    await file.CopyToAsync(stream);
                    stream.Position = 0;

                    var content = new MultipartFormDataContent();
                    content.Add(new StreamContent(stream), "file", file.FileName);

                    var client = _httpClientFactory.CreateClient();
                    var response = await client.PostAsync($"{_apiSettings.AdminApiBaseUrl}/Expert/ImportExcel", content);

                    if (response.IsSuccessStatusCode)
                    {
                        var rawJson = await response.Content.ReadAsStringAsync();
                        var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson)!;

                        if (jsonData != null && jsonData.Success)
                        {
                            return Json(new { success = true, message = jsonData.Message, data = jsonData.Data });
                        }
                        else
                        {
                            return Json(new { success = false, message = jsonData.Message, data = jsonData.Data });
                        }
                    }

                    // Xử lý lỗi từ API
                    return StatusCode((int)response.StatusCode, new { Message = $"Lỗi từ API: {response.ReasonPhrase}" });
                }
            }
            catch (Exception ex)
            {
                // Xử lý lỗi chung
                return StatusCode(500, new { Message = $"Lỗi xử lý file: {ex.Message}" });
            }
        }
    }
}
