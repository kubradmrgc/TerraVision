using TerraVision.Api.Entities.Common;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Entities
{
    public class ChatMessage : BaseEntity
    {
        public int SessionId { get; set; }
        public virtual ConsultationSession Session { get; set; } = null!;

        public int SenderId { get; set; }
        public virtual User Sender { get; set; } = null!;

        public string Content { get; set; } = string.Empty;
        public ChatMessageKind Kind { get; set; } = ChatMessageKind.Text;

        public string? ProposalTitle { get; set; }
        public string? ProposalNotes { get; set; }

        public virtual ICollection<ChatProposalLine> ProposalLines { get; set; } = new HashSet<ChatProposalLine>();
    }
}
