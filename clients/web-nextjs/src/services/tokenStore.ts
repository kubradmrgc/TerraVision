const ACCESS_TOKEN_KEY = 'terravision_web_access_token';
const REFRESH_TOKEN_KEY = 'terravision_web_refresh_token';

export const tokenStore = {
  setTokens(token: string, refreshToken: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  clearTokens(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};
