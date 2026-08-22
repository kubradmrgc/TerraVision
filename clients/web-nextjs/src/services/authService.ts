import { API_ROUTES, RegisterRequest, USER_ROLE } from '@terravision/shared';
import { notifyAuthChanged } from '@/constants/authEvents';
import { apiClient } from './apiClient';
import { tokenStore } from './tokenStore';
import { AuthResponse, LoginRequest } from '../types/auth';

const ROLE_KEY = 'terravision_web_role';
const PROFILE_KEY = 'terravision_web_profile';

export type StoredUserProfile = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: number;
};

function persistAuthSession(data: AuthResponse): void {
  tokenStore.setTokens(data.token, data.refreshToken);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ROLE_KEY, String(data.role));
    window.sessionStorage.setItem(ROLE_KEY, String(data.role));
    const profile: StoredUserProfile = {
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role
    };
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    window.sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
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
      window.localStorage.removeItem(PROFILE_KEY);
      window.sessionStorage.removeItem(PROFILE_KEY);
      notifyAuthChanged();
    }
  },

  getProfile(): StoredUserProfile | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw =
      window.localStorage.getItem(PROFILE_KEY) ?? window.sessionStorage.getItem(PROFILE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as StoredUserProfile;
    } catch {
      return null;
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
