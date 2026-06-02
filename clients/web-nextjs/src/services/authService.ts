import { API_ROUTES, RegisterRequest, USER_ROLE } from '@terravision/shared';
import { notifyAuthChanged } from '@/constants/authEvents';
import { apiClient } from './apiClient';
import { tokenStore } from './tokenStore';
import { AuthResponse, LoginRequest } from '../types/auth';

const ROLE_KEY = 'terravision_web_role';

function persistAuthSession(data: AuthResponse): void {
  tokenStore.setTokens(data.token, data.refreshToken);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ROLE_KEY, String(data.role));
    window.sessionStorage.setItem(ROLE_KEY, String(data.role));
    notifyAuthChanged();
  }
}

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(API_ROUTES.authLogin, payload);
    persistAuthSession(data);
    return data;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(API_ROUTES.authRegister, payload);
    persistAuthSession(data);
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
      window.localStorage.removeItem(ROLE_KEY);
      window.sessionStorage.removeItem(ROLE_KEY);
      notifyAuthChanged();
    }
  },

  getRole(): number | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw =
      window.localStorage.getItem(ROLE_KEY) ?? window.sessionStorage.getItem(ROLE_KEY);
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
