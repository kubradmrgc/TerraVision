import { API_ROUTES } from '@terravision/shared';
import { apiClient } from './apiClient';
import { ProductDto } from '../types/product';

export interface CreateProductWithImageInput {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  sku: string;
  categoryId: number;
  isArCompatible: boolean;
  image: File;
  wateringIntervalDays?: number | null;
  fertilizingIntervalDays?: number | null;
  cleaningIntervalDays?: number | null;
  careInstructions?: string | null;
}

export const productService = {
  async getProducts(): Promise<ProductDto[]> {
    const { data } = await apiClient.get<ProductDto[]>(API_ROUTES.products);
    return data;
  },

  async createWithImage(input: CreateProductWithImageInput): Promise<ProductDto> {
    const formData = new FormData();
    formData.append('name', input.name);
    formData.append('description', input.description);
    formData.append('price', String(input.price));
    formData.append('stockQuantity', String(input.stockQuantity));
    formData.append('minStockLevel', String(input.minStockLevel));
    formData.append('sku', input.sku);
    formData.append('categoryId', String(input.categoryId));
    formData.append('isArCompatible', String(input.isArCompatible));
    if (input.wateringIntervalDays != null && input.wateringIntervalDays > 0) {
      formData.append('wateringIntervalDays', String(input.wateringIntervalDays));
    }
    if (input.fertilizingIntervalDays != null && input.fertilizingIntervalDays > 0) {
      formData.append('fertilizingIntervalDays', String(input.fertilizingIntervalDays));
    }
    if (input.cleaningIntervalDays != null && input.cleaningIntervalDays > 0) {
      formData.append('cleaningIntervalDays', String(input.cleaningIntervalDays));
    }
    if (input.careInstructions?.trim()) {
      formData.append('careInstructions', input.careInstructions.trim());
    }
    formData.append('image', input.image);

    // Content-Type must include boundary; axios sets it automatically when omitted.
    const { data } = await apiClient.post<ProductDto>(API_ROUTES.productsWithImage, formData);
    return data;
  }
};
