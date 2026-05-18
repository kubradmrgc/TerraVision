export interface ProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  sku: string;
  imageUrl: string;
  isArCompatible: boolean;
  /** Present when an AR model is bound on the server. */
  arModelFileName?: string;
  categoryId: number;
}
