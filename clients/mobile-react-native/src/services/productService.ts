import { API_ROUTES } from '@terravision/shared';
import { apiClient } from './apiClient';
import { ProductDto } from '../types/product';

export const productService = {
  async getProducts(): Promise<ProductDto[]> {
    const { data } = await apiClient.get<ProductDto[]>(API_ROUTES.products);
    return data;
  }
};

export type { ProductDto };
