import axios from 'axios';
import { API_ROUTES } from '../apiContract';
import { isJwtExpired } from './jwt';
import type { TokenStore } from './tokenStore';
import { resolveTokenStoreValue } from './tokenStore';

export interface CreateTokenRefreshCoordinatorOptions {
  baseURL: string;
  tokenStore: TokenStore;
}

export interface TokenRefreshCoordinator {
  refreshAccessToken(): Promise<string>;
  getValidAccessToken(): Promise<string | null>;
}

export function createTokenRefreshCoordinator(
  options: CreateTokenRefreshCoordinatorOptions
): TokenRefreshCoordinator {
  const { baseURL, tokenStore } = options;
  let refreshPromise: Promise<string> | null = null;

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

  async function getValidAccessToken(): Promise<string | null> {
    const accessToken = await resolveTokenStoreValue(tokenStore.getAccessToken());
    if (accessToken && !isJwtExpired(accessToken)) {
      return accessToken;
    }

    const refreshToken = await resolveTokenStoreValue(tokenStore.getRefreshToken());
    if (!refreshToken) {
      return accessToken;
    }

    try {
      return await refreshAccessToken();
    } catch {
      await resolveTokenStoreValue(tokenStore.clearTokens());
      return null;
    }
  }

  return {
    refreshAccessToken,
    getValidAccessToken
  };
}
