import { API_ROUTES } from '@terravision/shared';
import { apiClient } from './apiClient';

export interface CategoryDto {
  id: number;
  name: string;
}

export const categoryService = {
  async getCategories(): Promise<CategoryDto[]> {
    const { data } = await apiClient.get<CategoryDto[]>(API_ROUTES.categories);
    return data;
  }
};
