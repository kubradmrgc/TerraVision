using System.ComponentModel.DataAnnotations;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Models.DTOs
{
    public class ChatConsultantDto
    {
        public int Id { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class ConsultationSessionDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int ConsultantId { get; set; }
        public string ConsultantName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public ConsultationSessionStatus Status { get; set; }
        public int? AppointmentId { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? LastMessageAt { get; set; }
    }

    public class ProposalLineDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal => UnitPrice * Quantity;
    }

    public class ProposalDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public IReadOnlyList<ProposalLineDto> Lines { get; set; } = Array.Empty<ProposalLineDto>();
        public decimal TotalAmount => Lines.Sum(l => l.LineTotal);
    }

    public class ChatMessageDto
    {
        public int Id { get; set; }
        public int SessionId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public ChatMessageKind Kind { get; set; }
        public ProposalDto? Proposal { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class CreateConsultationSessionRequest
    {
        [Required]
        public int ConsultantId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public int? AppointmentId { get; set; }
    }

    public class SendChatMessageRequest
    {
        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }

    public class SendProposalRequest
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Notes { get; set; }

        [Required]
        [MinLength(1)]
        public List<ProposalLineRequest> Lines { get; set; } = new();
    }

    public class ProposalLineRequest
    {
        [Required]
        public int ProductId { get; set; }

        [Range(1, 999)]
        public int Quantity { get; set; } = 1;
    }
}
