import { API_ROUTES } from '@terravision/shared';
import { apiClient } from './apiClient';
import { OrderDto } from '../types/order';

export const orderService = {
  async placeFromCart(notes = ''): Promise<OrderDto> {
    const { data } = await apiClient.post<OrderDto>(API_ROUTES.ordersFromCart, { notes });
    return data;
  },

  async getMyOrders(): Promise<OrderDto[]> {
    const { data } = await apiClient.get<OrderDto[]>(API_ROUTES.ordersMe);
    return data;
  }
};
