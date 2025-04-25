using Microsoft.AspNetCore.Mvc;

namespace Gentle_Blossom_FE.Controllers
{
    public class PregnancyCareController : Controller
    {
        public IActionResult HealthJourney()
        {
            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("HealthJourney");
            }
            return View();
        }

        public IActionResult PsychologyDiary()
        {
            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("PsychologyDiary");
            }
            return View();
        }
    }
}
