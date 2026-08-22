using TerraVision.Api.Entities.Common;

namespace TerraVision.Api.Entities
{
    /// <summary>Footer and support bar contact e-mail channels (destek, iletişim, vb.).</summary>
    public class SiteContactChannel : BaseEntity
    {
        /// <summary>Stable key, e.g. support, contact, info.</summary>
        public string ChannelKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }
}
