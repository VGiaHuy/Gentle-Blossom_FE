using Microsoft.AspNetCore.Mvc;

namespace Gentle_Blossom_FE.Areas.Admin.Controllers
{

    [Area("admin")]
    [Route("admin/homeadmin")]

    public class HomeController : Controller
    {
        [Route("")]
        [Route("index")]

        public IActionResult Index()
        {
            return View();
        }

    }
}
