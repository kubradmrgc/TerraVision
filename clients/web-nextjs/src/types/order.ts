import { CartItemDto } from './cart';

export interface OrderDto {
  id: number;
  userId: number;
  status: number;
  totalAmount: number;
  createdDate: string;
  updatedByUserId?: number;
  updatedReason?: string;
  items: CartItemDto[];
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
