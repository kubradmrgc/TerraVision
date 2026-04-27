export interface ProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  sku: string;
  imageUrl: string;
  isArCompatible: boolean;
  arModelFileName?: string;
  categoryId: number;
}
