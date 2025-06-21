namespace Gentle_Blossom_FE.Data.Constants
{
    public static class Treatments
    {
        public const int Psychology = 1;
        public const int Periodic = 2;

        public static readonly List<int> All = new()
        {
            Periodic, Psychology
        };
    }
}
