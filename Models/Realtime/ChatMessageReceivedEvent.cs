using TerraVision.Api.Models.DTOs;

namespace TerraVision.Api.Models.Realtime
{
    public sealed class ChatMessageReceivedEvent
    {
        public ChatMessageDto Message { get; set; } = null!;
        public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    }
}
