import React from 'react';
import { act, create } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMobileAppController } from '../src/features/app/useMobileAppController';

/** Assigned in jest.mock factories (hoisted) so tests can assert on the same fn instances. */
// eslint-disable-next-line no-var
var mockCreateAppointmentMutateAsync: jest.Mock;
// eslint-disable-next-line no-var
var mockAuthLogin: jest.Mock;

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
    registerFailed: 'Kayit tamamlanamadi.',
    sessionExpired: 'Oturumunuz sonlandi. Lutfen tekrar giris yapin.',
    sessionPartial: 'Oturum bilgisi eksik bulundu. Lutfen tekrar giris yapin.'
  },
  getSessionRestoreStatus: jest.fn(async () => 'none'),
  buildPostLogoutState: jest.requireActual('../src/features/auth/session').buildPostLogoutState
}));

jest.mock('../src/features/app/useCommerceQueries', () => {
  mockCreateAppointmentMutateAsync = jest.fn(async () => ({ id: 42 }));
  return {
    useCommerceQueries: () => ({
      productsQuery: { data: [], isLoading: false, error: null },
      cartQuery: { data: null, isLoading: false, error: null },
      ordersQuery: { data: [], isLoading: false, error: null },
      appointmentsQuery: { data: [], isLoading: false, error: null },
      createAppointmentMutation: { mutateAsync: mockCreateAppointmentMutateAsync, isPending: false },
      updateAppointmentStatusMutation: { mutateAsync: jest.fn(), isPending: false },
      addItemMutation: { mutateAsync: jest.fn(), isPending: false },
      updateItemMutation: { mutateAsync: jest.fn(), isPending: false },
      removeItemMutation: { mutateAsync: jest.fn(), isPending: false },
      clearCartMutation: { mutateAsync: jest.fn(), isPending: false },
      placeOrderMutation: { mutateAsync: jest.fn(), isPending: false }
    })
  };
});

jest.mock('../src/services/authService', () => {
  mockAuthLogin = jest.fn(async () => ({ role: 3 }));
  return {
    authService: {
      login: mockAuthLogin,
      register: jest.fn(async () => ({ role: 1 })),
      logout: jest.fn(async () => undefined)
    }
  };
});

jest.mock('../src/services/realtimeService', () => ({
  realtimeService: {
    connect: jest.fn(async () => undefined),
    disconnect: jest.fn(async () => undefined),
    onStatusChanged: jest.fn(() => () => undefined),
    onCartChanged: jest.fn(() => () => undefined),
    onOrderCreated: jest.fn(() => () => undefined),
    onOrderStatusChanged: jest.fn(() => () => undefined),
    onReconnected: jest.fn(() => () => undefined)
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

jest.mock('../src/services/tokenStore', () => ({
  tokenStore: {
    setProfile: jest.fn(async () => undefined),
    getProfile: jest.fn(async () => null),
    setTokens: jest.fn(async () => undefined),
    getToken: jest.fn(async () => null),
    getRefreshToken: jest.fn(async () => null),
    clearToken: jest.fn(async () => undefined)
  }
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
  beforeEach(() => {
    mockAuthLogin.mockImplementation(async () => ({ role: 3 }));
    mockCreateAppointmentMutateAsync.mockReset();
    mockCreateAppointmentMutateAsync.mockImplementation(async () => ({ id: 42 }));
  });

  it('starts with disabled login and toggles theme', async () => {
    let renderer: ReturnType<typeof renderHookHarness>;
    await act(async () => {
      renderer = renderHookHarness();
    });

    expect(latest).not.toBeNull();
    expect(latest!.isLoginDisabled).toBe(true);
    const initialTheme = latest!.state.themeMode;

    await act(async () => {
      latest!.selectLoginPortal('customer');
    });
    expect(latest!.isLoginDisabled).toBe(false);

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

describe('useMobileAppController handleCreateAppointment', () => {
  beforeEach(() => {
    mockAuthLogin.mockImplementation(async () => ({ role: 3 }));
    mockCreateAppointmentMutateAsync.mockReset();
    mockCreateAppointmentMutateAsync.mockImplementation(async () => ({ id: 42 }));
  });

  async function loginAsCustomer() {
    mockAuthLogin.mockImplementation(async () => ({ role: 1 }));
    let renderer: ReturnType<typeof renderHookHarness>;
    await act(async () => {
      renderer = renderHookHarness();
    });
    await act(async () => {
      latest!.selectLoginPortal('customer');
    });
    await act(async () => {
      await latest!.handleLogin();
    });
    return renderer!;
  }

  it('blocks create when role is not customer', async () => {
    let renderer: ReturnType<typeof renderHookHarness>;
    await act(async () => {
      renderer = renderHookHarness();
    });
    await act(async () => {
      latest!.selectLoginPortal('admin');
    });
    await act(async () => {
      await latest!.handleLogin();
    });

    await act(async () => {
      await latest!.handleCreateAppointment();
    });
    expect(latest!.appointmentErrorMessage).toContain('musteri hesabi');
    expect(mockCreateAppointmentMutateAsync).not.toHaveBeenCalled();
    renderer!.unmount();
  });

  it('requires positive integer consultant id', async () => {
    const renderer = await loginAsCustomer();
    await act(async () => {
      latest!.setAppointmentConsultantId('');
    });
    await act(async () => {
      await latest!.handleCreateAppointment();
    });
    expect(latest!.appointmentErrorMessage).toContain('consultant ID');
    expect(mockCreateAppointmentMutateAsync).not.toHaveBeenCalled();

    await act(async () => {
      latest!.setAppointmentConsultantId('0');
    });
    await act(async () => {
      await latest!.handleCreateAppointment();
    });
    expect(latest!.appointmentErrorMessage).toContain('consultant ID');

    await act(async () => {
      latest!.setAppointmentConsultantId('1.5');
    });
    await act(async () => {
      await latest!.handleCreateAppointment();
    });
    expect(latest!.appointmentErrorMessage).toContain('consultant ID');

    await act(async () => {
      latest!.setAppointmentConsultantId('x');
    });
    await act(async () => {
      await latest!.handleCreateAppointment();
    });
    expect(latest!.appointmentErrorMessage).toContain('consultant ID');

    renderer.unmount();
  });

  it('requires non-empty appointment date', async () => {
    const renderer = await loginAsCustomer();
    await act(async () => {
      latest!.setAppointmentConsultantId('2');
      latest!.setAppointmentDateTime('   ');
    });
    await act(async () => {
      await latest!.handleCreateAppointment();
    });
    expect(latest!.appointmentErrorMessage).toContain('Randevu tarihi');
    expect(mockCreateAppointmentMutateAsync).not.toHaveBeenCalled();
    renderer.unmount();
  });

  it('calls API when customer, consultant, and date are valid', async () => {
    const renderer = await loginAsCustomer();
    await act(async () => {
      latest!.setAppointmentConsultantId('2');
      latest!.setAppointmentDateTime('2026-06-01T10:00:00.000Z');
      latest!.setAppointmentNotes('  hello  ');
    });
    await act(async () => {
      await latest!.handleCreateAppointment();
    });
    expect(mockCreateAppointmentMutateAsync).toHaveBeenCalledWith({
      consultantId: 2,
      appointmentDate: '2026-06-01T10:00:00.000Z',
      notes: 'hello'
    });
    expect(latest!.appointmentSuccessMessage).toContain('Randevu #42');
    expect(latest!.appointmentDateTime).toBe('');
    expect(latest!.appointmentNotes).toBe('');
    renderer.unmount();
  });
});
