import { apiClient } from './apiClient';
import { CartDto } from '../types/cart';

export const cartService = {
  async getMyCart(): Promise<CartDto> {
    const { data } = await apiClient.get<CartDto>('/api/cart/me');
    return data;
  },

  async addItem(productId: number, quantity = 1): Promise<CartDto> {
    const { data } = await apiClient.post<CartDto>('/api/cart/items', { productId, quantity });
    return data;
  },

  async updateItem(productId: number, quantity: number): Promise<CartDto> {
    const { data } = await apiClient.put<CartDto>('/api/cart/items', { productId, quantity });
    return data;
  },

  async removeItem(productId: number): Promise<CartDto> {
    const { data } = await apiClient.delete<CartDto>(`/api/cart/items/${productId}`);
    return data;
  },

  async clearCart(): Promise<CartDto> {
    const { data } = await apiClient.delete<CartDto>('/api/cart/me');
    return data;
  }
};
