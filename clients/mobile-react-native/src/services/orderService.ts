import { apiClient } from './apiClient';
import { OrderDto } from '../types/order';

export const orderService = {
  async placeFromCart(notes = ''): Promise<OrderDto> {
    const { data } = await apiClient.post<OrderDto>('/api/orders/from-cart', { notes });
    return data;
  },

  async getMyOrders(): Promise<OrderDto[]> {
    const { data } = await apiClient.get<OrderDto[]>('/api/orders/me');
    return data;
  }
};
