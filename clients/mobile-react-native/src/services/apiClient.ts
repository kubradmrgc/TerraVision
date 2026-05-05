import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/env';
import { tokenStore } from './tokenStore';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

let refreshPromise: Promise<string> | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await tokenStore.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
      const token = response.data.token as string;
      const newRefreshToken = response.data.refreshToken as string;
      await tokenStore.setTokens(token, newRefreshToken);
      return token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch {
        await tokenStore.clearToken();
        unauthorizedHandler?.();
      }
    }

    return Promise.reject(error);
  }
);
