export interface TokenStore {
  getAccessToken(): string | null | Promise<string | null>;
  getRefreshToken(): string | null | Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): void | Promise<void>;
  clearTokens(): void | Promise<void>;
}

export async function resolveTokenStoreValue<T>(
  value: T | Promise<T>
): Promise<T> {
  return await value;
}
