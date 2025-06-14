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

        public static readonly Dictionary<int, string> TypeNames = new()
    {
        { Admin, "Admin" },
        { Expert, "Expert" },
        { User, "User" }
    };

        // Phương thức hỗ trợ lấy tên chuỗi theo giá trị int
        public static string GetTypeName(int type)
        {
            return TypeNames.TryGetValue(type, out var name) ? name : "Không xác định";
        }
    }
}
