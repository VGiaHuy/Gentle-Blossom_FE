using Gentle_Blossom_FE.Data.DTOs.UserDTOs;
using Gentle_Blossom_FE.Data.Settings;
using Gentle_Blossom_FE.Data.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;

namespace Gentle_Blossom_FE.Controllers
{
    public class PostController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ApiSettings _apiSettings;

        public PostController(IHttpClientFactory httpClientFactory, IOptions<ApiSettings> apiSettings)
        {
            _httpClientFactory = httpClientFactory;
            _apiSettings = apiSettings.Value;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPost(int page = 1, int pageSize = 5)
        {
            int userId = 0;
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Post/GetAllPost?userId={userId}&page={page}&pageSize={pageSize}");

            var rawJson = await response.Content.ReadAsStringAsync();
            var jsonData = JsonConvert.DeserializeObject<API_Response<List<PostDTO>>>(rawJson);

            if (response.IsSuccessStatusCode)
            {
                if (!jsonData.Data.Any())
                {
                    return Content("<div class='text-center text-muted'>Không còn bài viết nào!</div>");
                }

                return PartialView("~/Views/Shared/Component/Post.cshtml", jsonData.Data);
            }

            return Content($"<p>{jsonData.Message}</p>");
        }

        [HttpGet]
        public async Task<IActionResult> GetPostsOfUserById(string userId, int page = 1, int pageSize = 5)
        {
            int userID = int.Parse(userId);

            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Post/GetPostsOfUserById?id={userID}&page={page}&pageSize={pageSize}");

            var rawJson = await response.Content.ReadAsStringAsync();
            var jsonData = JsonConvert.DeserializeObject<API_Response<List<PostDTO>>>(rawJson);

            if (response.IsSuccessStatusCode)
            {
                if (!jsonData.Data.Any())
                {
                    return Content("<div class='text-center text-muted'>Không còn bài viết nào!</div>");
                }

                return PartialView("~/Views/Shared/Component/Post.cshtml", jsonData.Data);
            }

            return Content($"<p>{jsonData.Message}</p>");
        }

        [HttpPost]
        public async Task<IActionResult> CreatePost(CreatePostDTO model)
        {
            // Lấy token từ Claims
            var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
            if (string.IsNullOrEmpty(token))
            {
                ViewBag.Error = "Không tìm thấy token. Vui lòng đăng nhập lại.";
                await HttpContext.SignOutAsync();
                return RedirectToAction("Login", "Account");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var form = new MultipartFormDataContent();
            form.Add(new StringContent(model.Content), "Content");
            form.Add(new StringContent(model.UserId), "UserId");

            foreach (var file in model.MediaFiles)
            {
                var streamContent = new StreamContent(file.OpenReadStream());
                streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
                form.Add(streamContent, "MediaFiles", file.FileName);
            }

            // (Tuỳ bạn xác thực qua Cookie hay Token)
            // httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsync($"{_apiSettings.UserApiBaseUrl}/Post/CreatePost", form);

            if (response.IsSuccessStatusCode)
            {
                return Json(new {success = true, message = "Đăng bài viết thành công!"});
            }

            // Nếu lỗi
            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Đăng bài không thành công! Lỗi: " + error });
        }

        [HttpPost]
        public async Task<IActionResult> CreateComment([FromForm] CreateCommentDTOs model)
        {
            // Lấy token từ Claims
            var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
            if (string.IsNullOrEmpty(token))
            {
                ViewBag.Error = "Không tìm thấy token. Vui lòng đăng nhập lại.";
                await HttpContext.SignOutAsync();
                return RedirectToAction("Login", "Account");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            
            using var formData = new MultipartFormDataContent();

            formData.Add(new StringContent(model.PostId.ToString()), "PostId");
            formData.Add(new StringContent(model.PosterId.ToString()), "PosterId");
            if (model.ParentCommentId.HasValue)
            {
                formData.Add(new StringContent(model.ParentCommentId.Value.ToString()), "ParentCommentId");
            }
            formData.Add(new StringContent(model.Content), "Content");

            // Thêm file nếu có
            if (model.MediaFile != null && model.MediaFile.Length > 0)
            {
                // Kiểm tra định dạng file
                var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm" };
                if (!allowedContentTypes.Contains(model.MediaFile.ContentType))
                {
                    return Json(new { success = false, message = "File không hợp lệ. Chỉ chấp nhận hình ảnh (JPEG, PNG, GIF) hoặc video (MP4, WebM)." });
                }

                var fileContent = new StreamContent(model.MediaFile.OpenReadStream());
                fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(model.MediaFile.ContentType);
                formData.Add(fileContent, "MediaFile", model.MediaFile.FileName);
            }

            // Gửi yêu cầu đến backend API
            var response = await client.PostAsync($"{_apiSettings.UserApiBaseUrl}/Post/CreateComment", formData);

            if (response.IsSuccessStatusCode)
            {
                return Json(new { success = true, message = "Đăng bình luận thành công!" });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Đăng bình luận không thành công! Lỗi: " + error });
        }

        [HttpGet]
        public async Task<IActionResult> GetComments(string postId, int page = 1, int pageSize = 10)
        {
            int id = int.Parse(postId);

            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{_apiSettings.UserApiBaseUrl}/Post/GetCommentsByPostId?postId={id}&page={page}&pageSize={pageSize}");

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<CommentPostResponseDTO>>(rawJson);

                return Json(new
                {
                    success = true,
                    data = jsonData!.Data.Comments, // Trả về danh sách bình luận
                    hasMore = jsonData.Data.HasMore, // Trả về hasMore
                    message = "Lấy bình luận thành công!"
                });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Lấy bình luận không thành công! Lỗi: " + error });
        }

        [HttpPost]
        public async Task<IActionResult> ToggleLikePost(int postId, int userId)
        {
            ToggleLikePostDto data = new ToggleLikePostDto
            {
                PostId = postId,
                UserId = userId
            };

            var json = JsonConvert.SerializeObject(data);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Lấy token từ Claims
            var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
            if (string.IsNullOrEmpty(token))
            {
                ViewBag.Error = "Không tìm thấy token. Vui lòng đăng nhập lại.";
                await HttpContext.SignOutAsync();
                return RedirectToAction("Login", "Account");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsync($"{_apiSettings.UserApiBaseUrl}/Post/ToggleLikePost", content);

            if (response.IsSuccessStatusCode)
            {
                var rawJson = await response.Content.ReadAsStringAsync();
                var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson);

                return Json(new
                {
                    success = true,
                    message = "Like bài viết thành công!"
                });
            }

            var error = await response.Content.ReadAsStringAsync();
            return Json(new { success = false, message = "Like bài viết không thành công! Lỗi: " + error });
        }

        [HttpGet]
        public async Task<IActionResult> ProxyImage(string url, [FromServices] IMemoryCache cache)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return BadRequest("URL is required");
            }

            // Tạo key cache dựa trên URL
            var cacheKey = $"image_{url}";
            if (cache.TryGetValue(cacheKey, out (byte[] content, string contentType) cachedData))
            {
                return File(cachedData.content, cachedData.contentType);
            }

            try
            {
                using var client = new HttpClient();
                client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36");
                client.Timeout = TimeSpan.FromSeconds(10);

                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, $"Failed to fetch image: {response.ReasonPhrase}");
                }

                var content = await response.Content.ReadAsByteArrayAsync();
                var contentType = response.Content.Headers.ContentType?.ToString() ?? "image/jpeg";

                // Lưu vào cache với thời gian hết hạn 1 giờ
                cache.Set(cacheKey, (content, contentType), TimeSpan.FromHours(1));

                return File(content, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching image: {ex.Message}");
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeletePost([FromQuery] int postId)
        {
            int userId = 0;
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

            // Lấy token từ Claims
            var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
            if (string.IsNullOrEmpty(token))
            {
                ViewBag.Error = "Không tìm thấy token. Vui lòng đăng nhập lại.";
                await HttpContext.SignOutAsync();
                return RedirectToAction("Login", "Account");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.DeleteAsync($"{_apiSettings.UserApiBaseUrl}/Post/DeletePost?postId={postId}&userId={userId}");
            var result = await response.Content.ReadFromJsonAsync<API_Response<object>>();

            return Json(result);
        }

        [HttpPost]
        public async Task<IActionResult> UpdatePost([FromForm] UpdatePostDTO model)
        {
            // Lấy token từ Claims
            var token = User.Claims.FirstOrDefault(c => c.Type == "JwtToken")?.Value;
            if (string.IsNullOrEmpty(token))
            {
                ViewBag.Error = "Không tìm thấy token. Vui lòng đăng nhập lại.";
                await HttpContext.SignOutAsync();
                return RedirectToAction("Login", "Account");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // trường hợp có thêm ảnh mới
            if (model.NewMedias != null)
            {
                var form = new MultipartFormDataContent();
                form.Add(new StringContent(model.PostId.ToString()), "PostId");

                foreach (var file in model.NewMedias)
                {
                    var streamContent = new StreamContent(file.OpenReadStream());
                    streamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
                    form.Add(streamContent, "MediaFiles", file.FileName);
                }

                var response = await client.PostAsync($"{_apiSettings.UserApiBaseUrl}/Post/UpdateImagePost", form);

                if (response.IsSuccessStatusCode)
                {
                    var rawJson = await response.Content.ReadAsStringAsync();
                    var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson);

                    return Json(new
                    {
                        success = true,
                        message = "Sửa bài viết thành công!"
                    });
                }

                var errorJson = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync())!;
                return Json(new { success = false, message = (string)errorJson.Message ?? "Đã xảy ra lỗi!" });
            }
            else
            {
                // trường hợp xóa ảnh hoặc đổi nội dung
                var response = await client.PostAsJsonAsync($"{_apiSettings.UserApiBaseUrl}/Post/UpdatePost", model);

                if (response.IsSuccessStatusCode)
                {
                    var rawJson = await response.Content.ReadAsStringAsync();
                    var jsonData = JsonConvert.DeserializeObject<API_Response<object>>(rawJson);

                    return Json(new
                    {
                        success = true,
                        message = "Sửa bài viết thành công!"
                    });
                }

                var errorJson = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync())!;
                return Json(new { success = false, message = (string)errorJson.Message ?? "Đã xảy ra lỗi!" });
            }
        }
    }
}
