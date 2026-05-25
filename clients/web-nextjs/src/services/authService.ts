import { API_ROUTES, USER_ROLE } from '@terravision/shared';
import { apiClient } from './apiClient';
import { tokenStore } from './tokenStore';
import { AuthResponse, LoginRequest } from '../types/auth';

const ROLE_KEY = 'terravision_web_role';

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(API_ROUTES.authLogin, payload);
    tokenStore.setTokens(data.token, data.refreshToken);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(ROLE_KEY, String(data.role));
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ROUTES.authLogout);
    } catch {
      // ignore
    }
    tokenStore.clearTokens();
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ROLE_KEY);
    }
  },

  getRole(): number | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw = window.sessionStorage.getItem(ROLE_KEY);
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  },

  isCustomer(): boolean {
    return authService.getRole() === USER_ROLE.Customer;
  },

  isAdmin(): boolean {
    return authService.getRole() === USER_ROLE.Admin;
  }
};
