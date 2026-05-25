using TerraVision.Api.Enums;

namespace TerraVision.Api.Models.DTOs
{
    public class ExchangeProductDto
    {
        public int Id { get; set; }
        public int OwnerId { get; set; }
        public string OwnerDisplayName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool IsSwapOnly { get; set; }
        public ExchangeCondition Condition { get; set; }
        public IReadOnlyList<string> PhotoUrls { get; set; } = Array.Empty<string>();
        public bool IsActive { get; set; }
        public ExchangeProductStatus Status { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class CreateExchangeProductRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public ExchangeCondition Condition { get; set; } = ExchangeCondition.Healthy;
        public List<string> PhotoUrls { get; set; } = new();
    }

    public class UpdateExchangeProductRequest
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public ExchangeCondition Condition { get; set; }
        public List<string> PhotoUrls { get; set; } = new();
        public bool IsActive { get; set; } = true;
        public ExchangeProductStatus Status { get; set; }
    }

    public class ExchangeOfferDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductTitle { get; set; } = string.Empty;
        public int SenderId { get; set; }
        public string SenderDisplayName { get; set; } = string.Empty;
        public int OwnerId { get; set; }
        public ExchangeOfferType OfferType { get; set; }
        public string Message { get; set; } = string.Empty;
        public ExchangeOfferStatus Status { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class CreateExchangeOfferRequest
    {
        public int ProductId { get; set; }
        public ExchangeOfferType OfferType { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class UpdateExchangeOfferStatusRequest
    {
        public int Id { get; set; }
        public ExchangeOfferStatus Status { get; set; }
    }
}
