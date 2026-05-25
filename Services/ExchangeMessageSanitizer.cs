using System.Text.RegularExpressions;

namespace TerraVision.Api.Services
{
    public static partial class ExchangeMessageSanitizer
    {
        private static readonly Regex UrlPattern = UrlRegex();
        private static readonly Regex ScriptPattern = ScriptRegex();

        public static string Sanitize(string? message)
        {
            if (string.IsNullOrWhiteSpace(message))
            {
                return string.Empty;
            }

            var trimmed = message.Trim();
            if (trimmed.Length > 500)
            {
                throw new ArgumentException("Message must be 500 characters or fewer.");
            }

            if (UrlPattern.IsMatch(trimmed) || ScriptPattern.IsMatch(trimmed))
            {
                throw new ArgumentException("Messages cannot contain links or script-like content.");
            }

            return trimmed;
        }

        [GeneratedRegex(@"(https?:\/\/|www\.)\S+", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
        private static partial Regex UrlRegex();

        [GeneratedRegex(@"<script|javascript:|on\w+\s*=", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
        private static partial Regex ScriptRegex();
    }
}
