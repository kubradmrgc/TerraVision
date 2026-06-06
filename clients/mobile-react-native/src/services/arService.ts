import { API_ROUTES } from '@terravision/shared';
import { Platform } from 'react-native';
import { withResolvedModelUrl } from '../features/ar/arModelUrl';
import { apiClient } from './apiClient';
import { getArModelBaseUrl } from '../config/env';
import { ArPreviewResponse } from '../types/ar';

export const arService = {
  async getProductPreview(productId: number): Promise<ArPreviewResponse> {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const { data } = await apiClient.get<ArPreviewResponse>(API_ROUTES.arPreview(productId), {
      params: { platform, clientBaseUrl: getArModelBaseUrl() }
    });

    return withResolvedModelUrl(data);
  }
};
