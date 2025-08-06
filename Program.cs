using Gentle_Blossom_FE.Data.Settings;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// thêm dịch vụ authentication
builder.Services.AddAuthentication(option =>
{
    option.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    option.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
})
    .AddCookie(option =>
    {
        option.LoginPath = "/Auth/Login"; // Đường dẫn khi user chưa đăng nhập
    })
    .AddCookie("AdminCookie", options =>
    {
        options.LoginPath = "/admin/Account/Login"; // Đường dẫn khi admin chưa đăng nhập
        //options.AccessDeniedPath = "/admin/phanquyen/LoiPhanQuyen"; // Đường dẫn khi admin không có quyền truy cập
        options.Cookie.Name = "AdminAuthCookie"; // Tên của cookie dành cho admin
    })
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"];
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
        options.CallbackPath = "/signin-google";

        // Thêm các scope cần thiết
        options.Scope.Add("profile");
        options.Scope.Add("email");
        options.Scope.Add("https://www.googleapis.com/auth/userinfo.profile");
        options.ClaimActions.MapJsonKey("picture", "picture");
    });


// Cấu hình Authorization với Roles
builder.Services.AddAuthorization(options =>
    {
        // Policy cho User
        options.AddPolicy("UserPolicy", policy =>
            policy.RequireRole("User"));

        // Policy cho Expert
        options.AddPolicy("ExpertPolicy", policy =>
            policy.RequireRole("Expert"));

        //// Policy cho Admin
        //options.AddPolicy("AdminPolicy", policy =>
        //    policy.RequireRole("Admin"));

        // Policy yêu cầu User hoặc Expert
        options.AddPolicy("UserOrExpertPolicy", policy =>
            policy.RequireRole("User", "Expert"));
    });

builder.Services.AddSignalR();

builder.Services.Configure<ApiSettings>(builder.Configuration.GetSection("ApiSettings"));
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
