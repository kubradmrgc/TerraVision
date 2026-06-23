using System.Net;
using System.Text.Json;
using TerraVision.Api.Models;

namespace TerraVision.Api.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sunucu işlem sırasında beklenmeyen bir hatayla karşılaştı.");
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            
            // Özelleşmiş iş mantığı hatalarını ayrıştırmak isterseniz (örneğin UnauthorizedAccessException, NotFoundException vs.)
            // Bu blok içerisinde statü kodu belirleyebilirsiniz.
            var statusCode = (int)HttpStatusCode.InternalServerError;
            var message = "Sunucu hatası oluştu, lütfen daha sonra tekrar deneyin.";

            // Örnek: Basitçe ArgumentException veya bilinen Exception tiplerini 400 Bad Request yapabilirsiniz.
            if (exception is UnauthorizedAccessException)
            {
                statusCode = (int)HttpStatusCode.Unauthorized;
                message = exception.Message;
            }
            else if (exception is KeyNotFoundException)
            {
                statusCode = (int)HttpStatusCode.NotFound;
                message = exception.Message;
            }
            else if (exception is ArgumentException || exception is InvalidOperationException)
            {
                statusCode = (int)HttpStatusCode.BadRequest;
                message = exception.Message;
            }

            context.Response.StatusCode = statusCode;

            var response = new ErrorResponse
            {
                Success = false,
                StatusCode = statusCode,
                Message = message,
                Errors = exception.Message // Geliştirme aşamasında hatanın kendisi gösterilebilir. Prod ortamında silinmelidir.
            };

            var jsonResult = JsonSerializer.Serialize(response);
            return context.Response.WriteAsync(jsonResult);
        }
    }
}
