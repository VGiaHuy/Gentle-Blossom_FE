using Gentle_Blossom_FE.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace Gentle_Blossom_FE.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

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
