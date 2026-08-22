namespace TerraVision.Api.Models.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int MinStockLevel { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsArCompatible { get; set; }
        public string? ArModelFileName { get; set; }
        public int CategoryId { get; set; }
        public int? WateringIntervalDays { get; set; }
        public int? FertilizingIntervalDays { get; set; }
        public int? CleaningIntervalDays { get; set; }
        public string? CareInstructions { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public bool IsFeatured { get; set; }
        public string? PromoLabel { get; set; }
        public int PromoSortOrder { get; set; }
        public DateTime? PromoStartsAtUtc { get; set; }
        public DateTime? PromoEndsAtUtc { get; set; }
    }

    public class CreateProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int MinStockLevel { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsArCompatible { get; set; }
        public string? ArModelFileName { get; set; }
        public int CategoryId { get; set; }
        public int? WateringIntervalDays { get; set; }
        public int? FertilizingIntervalDays { get; set; }
        public int? CleaningIntervalDays { get; set; }
        public string? CareInstructions { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public bool IsFeatured { get; set; }
        public string? PromoLabel { get; set; }
        public int PromoSortOrder { get; set; }
        public DateTime? PromoStartsAtUtc { get; set; }
        public DateTime? PromoEndsAtUtc { get; set; }
    }

    public class CreateProductWithImageRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int MinStockLevel { get; set; }
        public string SKU { get; set; } = string.Empty;
        public bool IsArCompatible { get; set; }
        public int CategoryId { get; set; }
        public int? WateringIntervalDays { get; set; }
        public int? FertilizingIntervalDays { get; set; }
        public int? CleaningIntervalDays { get; set; }
        public string? CareInstructions { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public bool IsFeatured { get; set; }
        public string? PromoLabel { get; set; }
        public int PromoSortOrder { get; set; }
        public DateTime? PromoStartsAtUtc { get; set; }
        public DateTime? PromoEndsAtUtc { get; set; }
    }

    public class CreateProductWithImageForm
    {
        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Ürün adı zorunludur.")]
        [System.ComponentModel.DataAnnotations.MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Açıklama zorunludur.")]
        public string Description { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Range(0, double.MaxValue, ErrorMessage = "Fiyat 0 veya üzeri olmalıdır.")]
        public decimal Price { get; set; }

        [System.ComponentModel.DataAnnotations.Range(0, int.MaxValue, ErrorMessage = "Stok 0 veya üzeri olmalıdır.")]
        public int StockQuantity { get; set; }

        [System.ComponentModel.DataAnnotations.Range(0, int.MaxValue, ErrorMessage = "Minimum stok eşiği 0 veya üzeri olmalıdır.")]
        public int MinStockLevel { get; set; }

        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "SKU zorunludur.")]
        [System.ComponentModel.DataAnnotations.MaxLength(50)]
        public string SKU { get; set; } = string.Empty;

        public bool IsArCompatible { get; set; }

        [System.ComponentModel.DataAnnotations.Range(1, int.MaxValue, ErrorMessage = "Geçerli bir kategori seçin.")]
        public int CategoryId { get; set; }

        [System.ComponentModel.DataAnnotations.Range(1, 365, ErrorMessage = "Sulama aralığı 1–365 gün olmalıdır.")]
        public int? WateringIntervalDays { get; set; }

        [System.ComponentModel.DataAnnotations.Range(1, 365, ErrorMessage = "Gübreleme aralığı 1–365 gün olmalıdır.")]
        public int? FertilizingIntervalDays { get; set; }

        [System.ComponentModel.DataAnnotations.Range(1, 365, ErrorMessage = "Temizlik aralığı 1–365 gün olmalıdır.")]
        public int? CleaningIntervalDays { get; set; }

        [System.ComponentModel.DataAnnotations.MaxLength(2000)]
        public string? CareInstructions { get; set; }
    }

    public class UpdateProductRequest
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int MinStockLevel { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsArCompatible { get; set; }
        public string? ArModelFileName { get; set; }
        public int CategoryId { get; set; }
        public int? WateringIntervalDays { get; set; }
        public int? FertilizingIntervalDays { get; set; }
        public int? CleaningIntervalDays { get; set; }
        public string? CareInstructions { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public bool IsFeatured { get; set; }
        public string? PromoLabel { get; set; }
        public int PromoSortOrder { get; set; }
        public DateTime? PromoStartsAtUtc { get; set; }
        public DateTime? PromoEndsAtUtc { get; set; }
    }
}
