import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '../features/app/types';

const ACCESS_TOKEN_KEY = 'terravision_access_token';
const REFRESH_TOKEN_KEY = 'terravision_refresh_token';
const PROFILE_KEY = 'terravision_profile';

export const tokenStore = {
  async setTokens(token: string, refreshToken: string): Promise<void> {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  async setProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  async getProfile(): Promise<UserProfile | null> {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  async clearToken(): Promise<void> {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, PROFILE_KEY]);
  }
};
