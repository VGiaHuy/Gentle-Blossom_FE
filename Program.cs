﻿using Gentle_Blossom_FE.Data.Settings;
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
    });
    //.AddGoogle(GoogleDefaults.AuthenticationScheme, option =>
    //{
    //    option.ClientId = builder.Configuration.GetSection("GoogleKeys:ClientId").Value;
    //    option.ClientSecret = builder.Configuration.GetSection("GoogleKeys:ClientSecret").Value;
    //});

// Cấu hình Authorization với Roles
builder.Services.AddAuthorization(options =>
{
    // Policy cho User
    options.AddPolicy("UserPolicy", policy =>
        policy.RequireRole("User"));

    // Policy cho Expert
    options.AddPolicy("ExpertPolicy", policy =>
        policy.RequireRole("Expert"));

    // Policy cho Admin
    options.AddPolicy("AdminPolicy", policy =>
        policy.RequireRole("Admin"));

    // Policy yêu cầu User hoặc Expert
    options.AddPolicy("UserOrExpertPolicy", policy =>
        policy.RequireRole("User", "Expert"));
});


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
