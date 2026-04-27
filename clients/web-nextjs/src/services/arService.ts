import { apiClient } from './apiClient';
import { ArPreviewResponse } from '../types/ar';
import { API_BASE_URL } from '../config/env';

export const arService = {
  async getProductPreview(productId: number, platform: 'android' | 'ios' = 'android'): Promise<ArPreviewResponse> {
    const { data } = await apiClient.get<ArPreviewResponse>(`/api/ar/products/${productId}/preview`, {
      params: { platform }
    });

    return {
      ...data,
      modelUrl: data.modelUrl.startsWith('http') ? data.modelUrl : `${API_BASE_URL}${data.modelUrl}`
    };
  }
};
