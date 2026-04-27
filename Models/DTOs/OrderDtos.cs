using TerraVision.Api.Enums;

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

    public class OrderDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public OrderStatus Status { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime CreatedDate { get; set; }
        public int? UpdatedByUserId { get; set; }
        public string? UpdatedReason { get; set; }
        public List<OrderItemDto> Items { get; set; } = [];
    }

    public class PlaceOrderRequest
    {
        public string Notes { get; set; } = string.Empty;
    }

    public class UpdateOrderStatusRequest
    {
        public OrderStatus Status { get; set; }
        public string? Reason { get; set; }
    }

    public class AdminOrderListQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public OrderStatus? Status { get; set; }
        public int? OrderId { get; set; }
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
