namespace Gentle_Blossom_FE.Data.Constants
{
    public static class UserTypeName
    {
        public const int Admin = 1;
        public const int Expert = 2;
        public const int User = 3;

        public static readonly List<int> All = new()
        {
            Admin, Expert, User
        };
    }
}
