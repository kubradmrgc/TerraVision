using TerraVision.Api.Enums;
using System.ComponentModel.DataAnnotations;

namespace TerraVision.Api.Models.DTOs
{
    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal LineTotal => UnitPrice * Quantity;
    }

    public class OrderStatusHistoryDto
    {
        public OrderStatus? PreviousStatus { get; set; }
        public OrderStatus NewStatus { get; set; }
        public int ChangedByUserId { get; set; }
        public string? Reason { get; set; }
        public DateTime OccurredAtUtc { get; set; }
    }

    public class OrderDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public OrderStatus Status { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedDate { get; set; }
        public int? UpdatedByUserId { get; set; }
        public string? UpdatedReason { get; set; }
        public List<OrderItemDto> Items { get; set; } = [];
        public List<OrderStatusHistoryDto> StatusHistory { get; set; } = [];
    }

    public class PlaceOrderRequest
    {
        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;
    }

    public class UpdateOrderStatusRequest
    {
        [Required]
        public OrderStatus Status { get; set; }
        [MaxLength(500)]
        public string? Reason { get; set; }
    }

    public class AdminOrderListQuery
    {
        [Range(1, int.MaxValue)]
        public int Page { get; set; } = 1;
        [Range(1, 100)]
        public int PageSize { get; set; } = 20;
        public OrderStatus? Status { get; set; }
        public int? OrderId { get; set; }
        [Range(1, 365)]
        public int? RangeDays { get; set; }
    }

    public class PagedResult<T>
    {
        public IReadOnlyList<T> Items { get; set; } = [];
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling((double)TotalCount / PageSize);
    }
}
