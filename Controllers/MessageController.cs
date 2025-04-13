using Microsoft.AspNetCore.Mvc;

namespace Gentle_Blossom_FE.Controllers
{
    public class MessageController : Controller
    {
        public IActionResult Index()
        {
            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("Index");
            }
            return View();
        }
    }
}
