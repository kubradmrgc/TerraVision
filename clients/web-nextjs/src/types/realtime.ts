export interface CartChangedEvent {
  userId: number;
  productId: number;
  quantity: number;
  action: string;
  occurredAtUtc?: string;
}

export interface OrderCreatedEvent {
  userId: number;
  orderId: number;
  status: number;
  totalAmount: number;
  occurredAtUtc?: string;
}

export interface OrderStatusChangedEvent {
  userId: number;
  orderId: number;
  previousStatus: number;
  newStatus: number;
  updatedByUserId?: number;
  updatedReason?: string;
  occurredAtUtc?: string;
}
