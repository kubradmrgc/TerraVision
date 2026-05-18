import { API_ROUTES } from '@terravision/shared';
import { apiClient } from './apiClient';
import { CartDto } from '../types/cart';

export const cartService = {
  async getMyCart(): Promise<CartDto> {
    const { data } = await apiClient.get<CartDto>(API_ROUTES.cartMe);
    return data;
  },

  async addItem(productId: number, quantity = 1): Promise<CartDto> {
    const { data } = await apiClient.post<CartDto>(API_ROUTES.cartItems, { productId, quantity });
    return data;
  },

  async updateItem(productId: number, quantity: number): Promise<CartDto> {
    const { data } = await apiClient.put<CartDto>(API_ROUTES.cartItems, { productId, quantity });
    return data;
  },

  async removeItem(productId: number): Promise<CartDto> {
    const { data } = await apiClient.delete<CartDto>(API_ROUTES.cartItemByProduct(productId));
    return data;
  },

  async clearCart(): Promise<CartDto> {
    const { data } = await apiClient.delete<CartDto>(API_ROUTES.cartMe);
    return data;
  }
};
