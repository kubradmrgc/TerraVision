import { API_ROUTES, ArSessionResponseDto } from '@terravision/shared';
import { apiClient } from './apiClient';

export { resolveMediaUrl } from '../utils/mediaUrl';

export const arSessionService = {
  async getMySessions(): Promise<ArSessionResponseDto[]> {
    const { data } = await apiClient.get<ArSessionResponseDto[]>(API_ROUTES.AR.getMySessions);
    return data;
  },

  async getAllSessions(): Promise<ArSessionResponseDto[]> {
    const { data } = await apiClient.get<ArSessionResponseDto[]>(API_ROUTES.AR.getAllSessions);
    return data;
  }
};
