export interface OrderItemDto {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusHistoryDto {
  previousStatus?: number;
  newStatus: number;
  changedByUserId: number;
  reason?: string;
  occurredAtUtc: string;
}

export interface OrderDto {
  id: number;
  userId: number;
  status: number;
  totalAmount: number;
  notes?: string;
  createdDate: string;
  updatedByUserId?: number;
  updatedReason?: string;
  items: OrderItemDto[];
  statusHistory?: OrderStatusHistoryDto[];
}
