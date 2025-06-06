namespace Gentle_Blossom_FE.Data.Constants
{
    public class SpecializationExpert
    {
        public const string Obstetrics = "Sản khoa";
        public const string Psychology = "Tâm lý học";
        public const string Pediatrics = "Nhi khoa";

        public static readonly List<string> All = new()
        {
            Obstetrics, Psychology, Pediatrics
        };
    }
}
