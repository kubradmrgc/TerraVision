import React from 'react';
import { Alert } from 'react-native';
import { act, create } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMobileAppController } from '../src/features/app/useMobileAppController';

const mockAddItem = jest.fn();
const mockPlaceOrder = jest.fn();
const mockUpdateAppointmentStatus = jest.fn();
const mockOnUnauthorized = jest.fn();
const mockOnStatusChanged = jest.fn((_handler?: unknown) => () => undefined);
const mockConnect = jest.fn(async () => undefined);

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
  getSessionRestoreStatus: jest.fn(async () => 'active'),
  buildPostLogoutState: jest.requireActual('../src/features/auth/session').buildPostLogoutState
}));

jest.mock('../src/features/app/useCommerceQueries', () => ({
  useCommerceQueries: () => ({
    productsQuery: { data: [{ id: 1, name: 'P1', isArCompatible: false }], isLoading: false, error: null },
    cartQuery: { data: { totalAmount: 0, items: [] }, isLoading: false, error: null },
    ordersQuery: { data: [], isLoading: false, error: null },
    appointmentsQuery: {
      data: [
        { id: 201, customerId: 10, consultantId: 2, appointmentDate: '2026-05-20T10:30:00Z', notes: 'n1', status: 1 },
        { id: 202, customerId: 10, consultantId: 2, appointmentDate: '2026-05-21T11:00:00Z', notes: 'n2', status: 2 }
      ],
      isLoading: false,
      error: null
    },
    createAppointmentMutation: { mutateAsync: jest.fn(), isPending: false },
    updateAppointmentStatusMutation: { mutateAsync: mockUpdateAppointmentStatus, isPending: false },
    addItemMutation: { mutateAsync: mockAddItem, isPending: false },
    updateItemMutation: { mutateAsync: jest.fn(), isPending: false },
    removeItemMutation: { mutateAsync: jest.fn(), isPending: false },
    clearCartMutation: { mutateAsync: jest.fn(), isPending: false },
    placeOrderMutation: { mutateAsync: mockPlaceOrder, isPending: false }
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
    connect: () => mockConnect(),
    disconnect: jest.fn(async () => undefined),
    onStatusChanged: (handler: unknown) => mockOnStatusChanged(handler),
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
  onUnauthorized: (...args: unknown[]) => mockOnUnauthorized(...args)
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

describe('mobile integration scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  it('maps cart mutation errors to user-facing status messages', async () => {
    mockAddItem.mockRejectedValueOnce({ isAxiosError: true, response: { status: 409 } });

    let renderer: ReturnType<typeof renderHookHarness>;
    await act(async () => {
      renderer = renderHookHarness();
    });
    await act(async () => {
      await latest!.handleAddToCart(1);
    });

    expect(latest!.cartErrorMessage).toContain('Stok');
    renderer!.unmount();
  });

  it('maps order creation errors by status code', async () => {
    mockPlaceOrder.mockRejectedValueOnce({ isAxiosError: true, response: { status: 400 } });

    let renderer: ReturnType<typeof renderHookHarness>;
    await act(async () => {
      renderer = renderHookHarness();
    });
    await act(async () => {
      await latest!.handlePlaceOrder();
    });

    expect(latest!.orderErrorMessage).toContain('Sepet bos');
    renderer!.unmount();
  });

  it('moves to orders section and shows success message when order is created', async () => {
    mockPlaceOrder.mockResolvedValueOnce({ id: 99 });

    let renderer: ReturnType<typeof renderHookHarness>;
    await act(async () => {
      renderer = renderHookHarness();
    });
    await act(async () => {
      await latest!.handlePlaceOrder();
    });

    expect(latest!.orderSuccessMessage).toContain('#99');
    expect(latest!.state.activeSection).toBe('orders');
    renderer!.unmount();
  });

  it('clears selected ar file and resets ar upload feedback', async () => {
    let renderer: ReturnType<typeof renderHookHarness>;
    await act(async () => {
      renderer = renderHookHarness();
    });

    await act(async () => {
      latest!.handleClearSelectedArFile();
    });

    expect(latest!.state.selectedUploadFile).toBeNull();
    expect(latest!.arUploadErrorMessage).toBeNull();
    expect(latest!.arUploadSuccessMessage).toBeNull();
    expect(latest!.arUploadProgress).toBe(0);
    renderer!.unmount();
  });

  it('handles unauthorized callback by dropping session', async () => {
    let unauthorizedCb: (() => void) | undefined;
    mockOnUnauthorized.mockImplementation((cb: () => void) => {
      unauthorizedCb = cb;
    });

    let renderer: ReturnType<typeof renderHookHarness>;
    await act(async () => {
      renderer = renderHookHarness();
    });

    expect(latest!.state.loggedIn).toBe(true);
    await act(async () => {
      unauthorizedCb?.();
    });

    expect(latest!.state.loggedIn).toBe(false);
    expect(Alert.alert).toHaveBeenCalled();
    renderer!.unmount();
  });

  it('updates appointment status successfully for consultant/admin role', async () => {
    mockUpdateAppointmentStatus.mockResolvedValueOnce({ id: 202, status: 3 });

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
      await latest!.handleUpdateAppointmentStatus(202, 3);
    });

    expect(latest!.appointmentSuccessMessage).toContain('#202');
    expect(latest!.appointmentErrorMessage).toBeNull();
    renderer!.unmount();
  });

  it('maps appointment status update errors by status code', async () => {
    mockUpdateAppointmentStatus.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } });

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
      await latest!.handleUpdateAppointmentStatus(999, 4);
    });

    expect(latest!.appointmentErrorMessage).toContain('Randevu bulunamadi');
    renderer!.unmount();
  });

  it('filters appointments by selected status', async () => {
    let renderer: ReturnType<typeof renderHookHarness>;
    await act(async () => {
      renderer = renderHookHarness();
    });

    expect(latest!.state.appointments).toHaveLength(2);
    await act(async () => {
      latest!.setAppointmentFilterStatus(2);
    });
    expect(latest!.state.appointments).toHaveLength(1);
    expect(latest!.state.appointments[0]?.id).toBe(202);

    await act(async () => {
      latest!.setAppointmentFilterStatus('all');
    });
    expect(latest!.state.appointments).toHaveLength(2);
    renderer!.unmount();
  });
});
