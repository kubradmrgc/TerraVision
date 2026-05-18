import { API_ROUTES } from '@terravision/shared';
import { apiClient } from './apiClient';
import { OrderDto } from '../types/order';
import { UpdateOrderStatusRequest } from '../types/order';
import { PagedResult } from '../types/order';

export interface AdminOrderListQuery {
  page: number;
  pageSize: number;
  status?: number;
  orderId?: number;
  rangeDays?: number;
}

export const orderService = {
  async placeFromCart(notes = ''): Promise<OrderDto> {
    const { data } = await apiClient.post<OrderDto>(API_ROUTES.ordersFromCart, { notes });
    return data;
  },

  async getMyOrders(): Promise<OrderDto[]> {
    const { data } = await apiClient.get<OrderDto[]>('/api/orders/me');
    return data;
  },

  async getAllOrders(query: AdminOrderListQuery): Promise<PagedResult<OrderDto>> {
    const { data } = await apiClient.get<PagedResult<OrderDto>>(API_ROUTES.ordersAdmin, { params: query });
    return data;
  },

  async updateOrderStatus(orderId: number, request: UpdateOrderStatusRequest): Promise<OrderDto> {
    const { data } = await apiClient.patch<OrderDto>(API_ROUTES.orderStatus(orderId), request);
    return data;
  }
};
