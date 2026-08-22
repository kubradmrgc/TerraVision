namespace TerraVision.Api.Middlewares
{
    /// <summary>
    /// Ensures each HTTP request has a correlation id for logs and downstream tracing.
    /// Accepts <see cref="HeaderName"/> from the client; otherwise generates a new id.
    /// </summary>
    public sealed class CorrelationIdMiddleware
    {
        public const string ItemKey = "CorrelationId";
        public const string HeaderName = "X-Correlation-ID";

        private readonly RequestDelegate _next;

        public CorrelationIdMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var correlationId = context.Request.Headers[HeaderName].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(correlationId))
            {
                correlationId = Guid.NewGuid().ToString("N");
            }

            context.Items[ItemKey] = correlationId;
            context.Response.Headers[HeaderName] = correlationId;

            await _next(context);
        }
    }
}
