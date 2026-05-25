import { createApiClient, type TokenStore } from '@terravision/shared';
import { API_BASE_URL } from '../config/env';
import { tokenStore as webTokenStore } from './tokenStore';

const tokenStore: TokenStore = {
  getAccessToken: () => webTokenStore.getToken(),
  getRefreshToken: () => webTokenStore.getRefreshToken(),
  setTokens: (accessToken, refreshToken) => webTokenStore.setTokens(accessToken, refreshToken),
  clearTokens: () => webTokenStore.clearTokens()
};

const { client } = createApiClient({ baseURL: API_BASE_URL, tokenStore });

export const apiClient = client;
