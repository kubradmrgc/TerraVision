export interface CartItemDto {
  productId: number;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CartDto {
  cartId: number;
  userId: number;
  totalAmount: number;
  items: CartItemDto[];
}
