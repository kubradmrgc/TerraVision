import { API_ROUTES } from '@terravision/shared';
import { apiClient } from './apiClient';
import { tokenStore } from './tokenStore';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(API_ROUTES.authLogin, payload);
    await tokenStore.setTokens(data.token, data.refreshToken);
    return data;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(API_ROUTES.authRegister, payload);
    await tokenStore.setTokens(data.token, data.refreshToken);
    return data;
  },

  async refresh(): Promise<AuthResponse> {
    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const { data } = await apiClient.post<AuthResponse>(API_ROUTES.authRefresh, { refreshToken });
    await tokenStore.setTokens(data.token, data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ROUTES.authLogout);
    } catch {
      // Token might already be expired/invalid. Local clear is enough for client logout.
    }

    await tokenStore.clearToken();
  }
};
