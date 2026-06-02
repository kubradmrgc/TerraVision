export interface ProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  sku: string;
  imageUrl: string;
  isArCompatible: boolean;
  /** Present when an AR model is bound on the server. */
  arModelFileName?: string;
  categoryId: number;
  /** Optional plant-care metadata surfaced on the product detail screen. */
  wateringIntervalDays?: number | null;
  fertilizingIntervalDays?: number | null;
  cleaningIntervalDays?: number | null;
  careInstructions?: string | null;
}
