import React from 'react';
import { act, create } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMobileAppController } from '../src/features/app/useMobileAppController';

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() }
}));

jest.mock('@react-native-documents/picker', () => ({
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: jest.fn(() => false),
  pick: jest.fn(async () => [])
}));

jest.mock('../src/features/auth/session', () => ({
  AUTH_UI_MESSAGES: {
    loginFailed: 'Email veya sifre gecersiz olabilir.',
    sessionExpired: 'Oturumunuz sonlandi. Lutfen tekrar giris yapin.',
    sessionPartial: 'Oturum bilgisi eksik bulundu. Lutfen tekrar giris yapin.'
  },
  getSessionRestoreStatus: jest.fn(async () => 'none'),
  buildPostLogoutState: jest.requireActual('../src/features/auth/session').buildPostLogoutState
}));

jest.mock('../src/features/app/useCommerceQueries', () => ({
  useCommerceQueries: () => ({
    productsQuery: { data: [], isLoading: false, error: null },
    cartQuery: { data: null, isLoading: false, error: null },
    ordersQuery: { data: [], isLoading: false, error: null },
    addItemMutation: { mutateAsync: jest.fn(), isPending: false },
    updateItemMutation: { mutateAsync: jest.fn(), isPending: false },
    removeItemMutation: { mutateAsync: jest.fn(), isPending: false },
    clearCartMutation: { mutateAsync: jest.fn(), isPending: false },
    placeOrderMutation: { mutateAsync: jest.fn(), isPending: false }
  })
}));

jest.mock('../src/services/authService', () => ({
  authService: {
    login: jest.fn(async () => ({ role: 3 })),
    logout: jest.fn(async () => undefined)
  }
}));

jest.mock('../src/services/realtimeService', () => ({
  realtimeService: {
    connect: jest.fn(async () => undefined),
    disconnect: jest.fn(async () => undefined),
    onStatusChanged: jest.fn(() => () => undefined),
    onCartChanged: jest.fn(() => () => undefined),
    onOrderCreated: jest.fn(() => () => undefined),
    onOrderStatusChanged: jest.fn(() => () => undefined)
  }
}));

jest.mock('../src/services/arService', () => ({
  arService: { getProductPreview: jest.fn(async () => null) }
}));

jest.mock('../src/services/mediaService', () => ({
  mediaService: { uploadArModelForProduct: jest.fn(async () => ({ uploaded: { fileName: 'x', url: 'u', size: 1 }, product: null })) }
}));

jest.mock('../src/services/productService', () => ({
  productService: { getProducts: jest.fn(async () => []) }
}));

jest.mock('../src/services/apiClient', () => ({
  onUnauthorized: jest.fn()
}));

let latest:
  | ReturnType<typeof useMobileAppController>
  | null = null;

function HookHarness() {
  latest = useMobileAppController();
  return null;
}

function renderHookHarness() {
  latest = null;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return create(
    <QueryClientProvider client={queryClient}>
      <HookHarness />
    </QueryClientProvider>
  );
}

describe('useMobileAppController unit', () => {
  it('starts with disabled login and toggles theme', async () => {
    let renderer: ReturnType<typeof renderHookHarness>;
    await act(async () => {
      renderer = renderHookHarness();
    });

    expect(latest).not.toBeNull();
    expect(latest!.isLoginDisabled).toBe(false);
    const initialTheme = latest!.state.themeMode;

    await act(async () => {
      latest!.setEmail('');
    });
    expect(latest!.isLoginDisabled).toBe(true);

    await act(async () => {
      latest!.toggleTheme();
    });
    expect(latest!.state.themeMode).not.toBe(initialTheme);

    renderer!.unmount();
  });
});
