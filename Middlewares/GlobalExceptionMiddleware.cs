using System.Net;
using System.Text.Json;
using TerraVision.Api.Models;

namespace TerraVision.Api.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public GlobalExceptionMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionMiddleware> logger,
            IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                var correlationId = context.Items[CorrelationIdMiddleware.ItemKey]?.ToString();
                _logger.LogError(ex, "Sunucu işlem sırasında beklenmeyen bir hatayla karşılaştı. {CorrelationId}", correlationId);
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var statusCode = (int)HttpStatusCode.InternalServerError;
            var message = "Sunucu hatası oluştu, lütfen daha sonra tekrar deneyin.";
            object? errors = null;

            switch (exception)
            {
                case KeyNotFoundException:
                    statusCode = (int)HttpStatusCode.NotFound;
                    message = exception.Message;
                    break;
                case UnauthorizedAccessException:
                    statusCode = (int)HttpStatusCode.Unauthorized;
                    message = exception.Message;
                    break;
                case ArgumentException:
                case InvalidOperationException:
                    statusCode = (int)HttpStatusCode.BadRequest;
                    message = exception.Message;
                    break;
            }

            if (_environment.IsDevelopment())
            {
                errors = exception.Message;
            }

            context.Response.StatusCode = statusCode;

            var response = new ErrorResponse
            {
                Success = false,
                StatusCode = statusCode,
                Message = message,
                Errors = errors
            };

            var jsonResult = JsonSerializer.Serialize(response);
            return context.Response.WriteAsync(jsonResult);
        }
    }
}
