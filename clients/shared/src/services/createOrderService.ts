import { API_ROUTES } from '../apiContract';
import type { ApiHttpClient } from '../http/apiHttp';
import type { OrderDto } from '../types/order';

export function createOrderService(client: ApiHttpClient) {
  return {
    async placeFromCart(notes = ''): Promise<OrderDto> {
      const { data } = await client.post<OrderDto>(API_ROUTES.ordersFromCart, { notes });
      return data;
    },

    async getMyOrders(): Promise<OrderDto[]> {
      const { data } = await client.get<OrderDto[]>(API_ROUTES.ordersMe);
      return data;
    }
  };
}

export type OrderServiceCore = ReturnType<typeof createOrderService>;
