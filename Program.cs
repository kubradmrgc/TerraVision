using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;
using TerraVision.Api.Data;
using TerraVision.Api.Hubs;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Middlewares;
using TerraVision.Api.Services;
using TerraVision.Api.Extensions;
using TerraVision.Api.Settings;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile(
    $"appsettings.{builder.Environment.EnvironmentName}.local.json",
    optional: true,
    reloadOnChange: true);

// Reject oversized uploads at the host before buffering entire bodies into memory.
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = MediaUploadRules.MaxHttpRequestBodyBytes;
});
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = MediaUploadRules.MaxHttpRequestBodyBytes;
});

// Add services to the container.
builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var redisConnection = builder.Configuration.GetConnectionString("Redis");

// Entity Framework — integration tests use InMemory only (single provider).
if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<TerraVisionDbContext>(options =>
        options.UseInMemoryDatabase("TerraVisionIntegrationTests"));
}
else
{
    builder.Services.AddDbContext<TerraVisionDbContext>(options =>
        options.UseSqlServer(connectionString));
}
builder.Services.AddMemoryCache();
var useRedis = !builder.Environment.IsEnvironment("Testing") &&
               !builder.Environment.IsDevelopment() &&
               !string.IsNullOrWhiteSpace(redisConnection);
if (useRedis)
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnection;
        options.InstanceName = "TerraVision:";
    });
}
else
{
    builder.Services.AddDistributedMemoryCache();
}

// Dependency Injection
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICampaignService, CampaignService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<IAppointmentInstrumentation, AppointmentInstrumentation>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IRealtimeSyncService, SignalRRealtimeSyncService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddTerraVisionMediaStorage(builder.Configuration, builder.Environment);
builder.Services.AddScoped<IArSessionService, ArSessionService>();
builder.Services.AddScoped<ICareService, CareService>();
builder.Services.AddTerraVisionCareAssistant(builder.Configuration);
builder.Services.AddScoped<IExchangeService, ExchangeService>();
builder.Services.AddScoped<IUserAdminService, UserAdminService>();
builder.Services.AddTerraVisionEmail(builder.Configuration);
builder.Services.AddTerraVisionCartAbandonment(builder.Configuration, builder.Environment);

// JWT Authentication ayarları
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings?.Issuer,
            ValidAudience = jwtSettings?.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings?.Secret ?? "")),
            // MapInboundClaims = false keeps JWT short claim types; role-based [Authorize] must read the same type.
            RoleClaimType = "role",
            NameClaimType = "sub"
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/terravision"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddTerraVisionRateLimiting(builder.Configuration, builder.Environment);
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddPolicy("TerraVisionClients", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000",
                "http://localhost:8081",
                "http://127.0.0.1:8081",
                "http://localhost:8082",
                "http://127.0.0.1:8082")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    var media = app.Configuration.GetSection(MediaStorageSettings.SectionName).Get<MediaStorageSettings>();
    if (media is { Provider: "Local" } && string.IsNullOrWhiteSpace(media.PublicBaseUrl))
    {
        app.Logger.LogWarning(
            "AR preview requires MediaStorage:PublicBaseUrl (public HTTPS, e.g. a Cloudflare/ngrok tunnel to this API). " +
            "Copy appsettings.Development.local.json.example to appsettings.Development.local.json and set your tunnel URL.");
    }
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Initialize DB schema with migrations (skip in integration tests / alternate hosts)
if (!app.Environment.IsEnvironment("Testing"))
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<TerraVisionDbContext>();
        db.Database.Migrate();
    }
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseStaticFiles();
app.UseCors("TerraVisionClients");
app.UseAuthentication();
app.UseAuthorization();
if (!app.Environment.IsEnvironment("Testing"))
{
    app.UseRateLimiter();
}
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapHub<TerraVisionHub>("/hubs/terravision");

app.Run();

public partial class Program { }
