import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_ROUTES } from '../apiContract';
import type { TokenStore } from './tokenStore';
import { resolveTokenStoreValue } from './tokenStore';

export interface CreateApiClientOptions {
  baseURL: string;
  tokenStore: TokenStore;
  timeout?: number;
}

export interface AuthenticatedApiClient {
  client: AxiosInstance;
  /** Register handler invoked when refresh fails after 401 (mobile logout redirect, etc.). */
  onUnauthorized(handler: () => void | Promise<void>): void;
}

export function createApiClient(options: CreateApiClientOptions): AuthenticatedApiClient {
  const { baseURL, tokenStore, timeout = 15_000 } = options;
  const client = axios.create({ baseURL, timeout });

  let refreshPromise: Promise<string> | null = null;
  let unauthorizedHandler: (() => void | Promise<void>) | null = null;

  async function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshToken = await resolveTokenStoreValue(tokenStore.getRefreshToken());
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${baseURL}${API_ROUTES.authRefresh}`, { refreshToken });
        const token = response.data.token as string;
        const newRefreshToken = response.data.refreshToken as string;
        await resolveTokenStoreValue(tokenStore.setTokens(token, newRefreshToken));
        return token;
      })().finally(() => {
        refreshPromise = null;
      });
    }

    return refreshPromise;
  }

  client.interceptors.request.use(async (config) => {
    const token = await resolveTokenStoreValue(tokenStore.getAccessToken());
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const token = await refreshAccessToken();
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        } catch {
          await resolveTokenStoreValue(tokenStore.clearTokens());
          await unauthorizedHandler?.();
        }
      }

      return Promise.reject(error);
    }
  );

  return {
    client,
    onUnauthorized(handler: () => void | Promise<void>) {
      unauthorizedHandler = handler;
    }
  };
}
