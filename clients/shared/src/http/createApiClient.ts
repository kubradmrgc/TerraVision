import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  createTokenRefreshCoordinator,
  type TokenRefreshCoordinator
} from './createTokenRefreshCoordinator';
import type { TokenStore } from './tokenStore';
import { resolveTokenStoreValue } from './tokenStore';

export interface CreateApiClientOptions {
  baseURL: string;
  tokenStore: TokenStore;
  timeout?: number;
  /** Optional shared coordinator (e.g. also used by SignalR). */
  tokenRefresh?: TokenRefreshCoordinator;
}

export interface AuthenticatedApiClient {
  client: AxiosInstance;
  tokenRefresh: TokenRefreshCoordinator;
  /** Register handler invoked when refresh fails after 401 (mobile logout redirect, etc.). */
  onUnauthorized(handler: () => void | Promise<void>): void;
}

export function createApiClient(options: CreateApiClientOptions): AuthenticatedApiClient {
  const { baseURL, tokenStore, timeout = 15_000 } = options;
  const client = axios.create({ baseURL, timeout });
  const tokenRefresh =
    options.tokenRefresh ?? createTokenRefreshCoordinator({ baseURL, tokenStore });

  let unauthorizedHandler: (() => void | Promise<void>) | null = null;

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
          const token = await tokenRefresh.refreshAccessToken();
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
    tokenRefresh,
    onUnauthorized(handler: () => void | Promise<void>) {
      unauthorizedHandler = handler;
    }
  };
}
