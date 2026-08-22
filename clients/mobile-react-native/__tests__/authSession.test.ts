import { AUTH_UI_MESSAGES, buildPostLogoutState, getSessionRestoreStatus } from '../src/features/auth/session';
import type { MobileAppState } from '../src/features/app/types';

const baseState: MobileAppState = {
  authMode: 'login',
  firstName: '',
  lastName: '',
  confirmPassword: '',
  email: 'admin@terravision.com',
  password: 'admin123',
  loggedIn: true,
  isAdmin: true,
  role: 3,
  products: [],
  cart: null,
  orders: [],
  appointments: [],
  events: [],
  orderCreatedEvents: [],
  orderStatusEvents: [],
  arPreview: null,
  isArPreviewVisible: false,
  isArExperienceVisible: false,
  selectedUploadProductId: null,
  selectedUploadFile: null,
  themeMode: 'dark',
  activeSection: 'orders',
  loginPortal: 'admin',
  profile: null
};

describe('auth session helpers', () => {
  it('returns active when both tokens are present', async () => {
    const status = await getSessionRestoreStatus({
      getToken: async () => 'access',
      getRefreshToken: async () => 'refresh',
      clearToken: async () => undefined
    });
    expect(status).toBe('active');
  });

  it('returns none when tokens are absent', async () => {
    const status = await getSessionRestoreStatus({
      getToken: async () => null,
      getRefreshToken: async () => null,
      clearToken: async () => undefined
    });
    expect(status).toBe('none');
  });

  it('returns partial and clears token store when one token is missing', async () => {
    let clearCalled = false;
    const status = await getSessionRestoreStatus({
      getToken: async () => 'access-only',
      getRefreshToken: async () => null,
      clearToken: async () => {
        clearCalled = true;
      }
    });

    expect(status).toBe('partial');
    expect(clearCalled).toBe(true);
  });

  it('keeps theme and email while resetting state on logout', () => {
    const next = buildPostLogoutState(
      {
        ...baseState,
        loggedIn: false,
        isAdmin: false,
        themeMode: 'light',
        email: ''
      },
      baseState
    );

    expect(next.themeMode).toBe('dark');
    expect(next.email).toBe('admin@terravision.com');
    expect(next.loggedIn).toBe(false);
    expect(next.isAdmin).toBe(false);
  });

  it('contains standardized auth copy', () => {
    expect(AUTH_UI_MESSAGES.sessionExpired).toContain('Oturum');
    expect(AUTH_UI_MESSAGES.loginFailed).toContain('E-posta');
  });
});
