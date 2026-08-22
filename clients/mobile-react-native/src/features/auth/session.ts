import { tokenStore } from '../../services/tokenStore';
import { MobileAppState } from '../app/types';

type SessionStore = {
  getToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  clearToken: () => Promise<void>;
};

export const AUTH_UI_MESSAGES = {
  loginFailed: 'E-posta veya şifre geçersiz olabilir.',
  registerFailed: 'Kayıt tamamlanamadı. Bilgilerinizi kontrol edip tekrar deneyin.',
  sessionExpired: 'Oturumunuz sonlandı. Lütfen tekrar giriş yapın.',
  sessionPartial: 'Oturum bilgisi eksik bulundu. Lütfen tekrar giriş yapın.'
} as const;

export async function getSessionRestoreStatus(
  store: SessionStore = tokenStore
): Promise<'active' | 'none' | 'partial'> {
  const [token, refreshToken] = await Promise.all([store.getToken(), store.getRefreshToken()]);
  if (token && refreshToken) {
    return 'active';
  }
  if (!token && !refreshToken) {
    return 'none';
  }

  await store.clearToken();
  return 'partial';
}

export function buildPostLogoutState(
  initialState: MobileAppState,
  prevState: MobileAppState
): MobileAppState {
  return {
    ...initialState,
    themeMode: prevState.themeMode,
    email: prevState.email
  };
}
