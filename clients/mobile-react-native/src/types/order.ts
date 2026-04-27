export interface OrderItemDto {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDto {
  id: number;
  userId: number;
  status: number;
  totalAmount: number;
  createdDate: string;
  updatedByUserId?: number;
  updatedReason?: string;
  items: OrderItemDto[];
}
