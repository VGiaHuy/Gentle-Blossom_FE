using Microsoft.AspNetCore.Mvc;

namespace Gentle_Blossom_FE.Controllers
{
    public class AuthController : Controller
    {
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Login(string username, string password)
        {
            // Xử lý đăng nhập tại đây (có thể thêm xác thực cơ bản)
            if (username == "admin" && password == "123")
            {
                return RedirectToAction("Index", "Home");
            }

            ViewBag.Error = "Sai tài khoản hoặc mật khẩu";
            return View();
        }

        [HttpGet]
        public IActionResult Register()
        {
            return PartialView("Register");
        }
    }
}
