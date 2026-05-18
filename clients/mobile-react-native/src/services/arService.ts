import { API_ROUTES } from '@terravision/shared';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';
import { ArPreviewResponse } from '../types/ar';
import { API_BASE_URL } from '../config/env';

export const arService = {
  async getProductPreview(productId: number): Promise<ArPreviewResponse> {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const { data } = await apiClient.get<ArPreviewResponse>(API_ROUTES.arPreview(productId), {
      params: { platform }
    });

    return {
      ...data,
      modelUrl: data.modelUrl.startsWith('http') ? data.modelUrl : `${API_BASE_URL}${data.modelUrl}`
    };
  }
};
