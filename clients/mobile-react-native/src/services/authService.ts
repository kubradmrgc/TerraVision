import { apiClient } from './apiClient';
import { tokenStore } from './tokenStore';
import { AuthResponse, LoginRequest } from '../types/auth';

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
    await tokenStore.setTokens(data.token, data.refreshToken);
    return data;
  },

  async refresh(): Promise<AuthResponse> {
    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const { data } = await apiClient.post<AuthResponse>('/api/auth/refresh', { refreshToken });
    await tokenStore.setTokens(data.token, data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Token might already be expired/invalid. Local clear is enough for client logout.
    }

    await tokenStore.clearToken();
  }
};
