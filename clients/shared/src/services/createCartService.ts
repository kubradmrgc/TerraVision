import { API_ROUTES } from '../apiContract';
import type { ApiHttpClient } from '../http/apiHttp';
import type { CartDto } from '../types/cart';

export function createCartService(client: ApiHttpClient) {
  return {
    async getMyCart(): Promise<CartDto> {
      const { data } = await client.get<CartDto>(API_ROUTES.cartMe);
      return data;
    },

    async addItem(productId: number, quantity = 1): Promise<CartDto> {
      const { data } = await client.post<CartDto>(API_ROUTES.cartItems, { productId, quantity });
      return data;
    },

    async updateItem(productId: number, quantity: number): Promise<CartDto> {
      const { data } = await client.put<CartDto>(API_ROUTES.cartItems, { productId, quantity });
      return data;
    },

    async removeItem(productId: number): Promise<CartDto> {
      const { data } = await client.delete<CartDto>(API_ROUTES.cartItemByProduct(productId));
      return data;
    },

    async clearCart(): Promise<CartDto> {
      const { data } = await client.delete<CartDto>(API_ROUTES.cartMe);
      return data;
    },

    async addItems(items: Array<{ productId: number; quantity?: number }>): Promise<CartDto> {
      let cart: CartDto | null = null;
      for (const item of items) {
        cart = await this.addItem(item.productId, item.quantity ?? 1);
      }
      return cart ?? (await this.getMyCart());
    }
  };
}

export type CartService = ReturnType<typeof createCartService>;
