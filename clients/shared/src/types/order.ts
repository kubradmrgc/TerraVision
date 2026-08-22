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

export interface UpdateOrderStatusRequest {
  status: number;
  reason?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
