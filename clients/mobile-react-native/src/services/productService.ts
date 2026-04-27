import { apiClient } from './apiClient';
import { ProductDto } from '../types/product';

export const productService = {
  async getProducts(): Promise<ProductDto[]> {
    const { data } = await apiClient.get<ProductDto[]>('/api/products');
    return data;
  }
};

export type { ProductDto };
