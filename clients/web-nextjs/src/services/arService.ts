import { API_ROUTES } from '@terravision/shared';
import { apiClient } from './apiClient';
import { ArPreviewResponse } from '../types/ar';

export const arService = {
  async getProductPreview(productId: number, platform: 'android' | 'ios' = 'android'): Promise<ArPreviewResponse> {
    const { data } = await apiClient.get<ArPreviewResponse>(API_ROUTES.arPreview(productId), {
      params: { platform }
    });

    return data;
  }
};
