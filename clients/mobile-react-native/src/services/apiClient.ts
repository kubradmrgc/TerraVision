import { createApiClient, type TokenStore } from '@terravision/shared';
import { API_BASE_URL } from '../config/env';
import { tokenStore as mobileTokenStore } from './tokenStore';

const tokenStore: TokenStore = {
  getAccessToken: () => mobileTokenStore.getToken(),
  getRefreshToken: () => mobileTokenStore.getRefreshToken(),
  setTokens: (accessToken, refreshToken) => mobileTokenStore.setTokens(accessToken, refreshToken),
  clearTokens: () => mobileTokenStore.clearToken()
};

const { client, tokenRefresh, onUnauthorized: registerUnauthorized } = createApiClient({
  baseURL: API_BASE_URL,
  tokenStore
});

export const apiClient = client;
export { tokenRefresh };

export function onUnauthorized(handler: () => void): void {
  registerUnauthorized(handler);
}
