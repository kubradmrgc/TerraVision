export interface CartChangedEvent {
  userId: number;
  productId: number;
  quantity: number;
  action: string;
  occurredAtUtc?: string;
}

export interface CartAbandonedEvent {
  userId: number;
  cartId: number;
  customerEmail: string;
  totalAmount: number;
  itemCount: number;
  lastActivityAtUtc: string;
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

export interface ArSessionCreatedEvent {
  sessionId: number;
  userId: number;
  customerEmail: string;
  productId: number;
  productName: string;
  screenshotUrl: string;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  occurredAtUtc?: string;
}

export interface ProductLowStockEvent {
  productId: number;
  productName: string;
  stockQuantity: number;
  minStockLevel: number;
  message: string;
  occurredAtUtc?: string;
}
