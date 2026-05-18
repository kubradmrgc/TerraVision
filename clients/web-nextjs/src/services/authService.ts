import { API_ROUTES } from '@terravision/shared';
import { apiClient } from './apiClient';
import { tokenStore } from './tokenStore';
import { AuthResponse, LoginRequest } from '../types/auth';

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(API_ROUTES.authLogin, payload);
    tokenStore.setTokens(data.token, data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ROUTES.authLogout);
    } catch {
      // ignore
    }
    tokenStore.clearTokens();
  }
};
