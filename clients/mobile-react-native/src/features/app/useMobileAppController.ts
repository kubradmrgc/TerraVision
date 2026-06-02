import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { errorCodes, isErrorWithCode, pick } from '@react-native-documents/picker';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { tokenStore } from '../../services/tokenStore';
import { realtimeService } from '../../services/realtimeService';
import { arService } from '../../services/arService';
import { mediaService } from '../../services/mediaService';
import { productService } from '../../services/productService';
import { onUnauthorized } from '../../services/apiClient';
import { MobileSection, MobileAppState, ThemeMode, UserProfile } from './types';
import type { LoginPortal } from '@terravision/shared';
import { getPalette } from '../../theme/mobileTheme';
import { useCommerceQueries } from './useCommerceQueries';
import { validateArUploadFile } from '../ar/arUploadValidation';
import { AUTH_UI_MESSAGES, buildPostLogoutState, getSessionRestoreStatus } from '../auth/session';
import { pushUniqueEvent } from '../realtime/eventDedup';
import { toStatusMessage } from '../../ui/httpError';
import {
  roleMatchesPortal,
  portalRoleMismatchMessage,
  syncQueriesOnReconnect,
  toCustomerRegisterRequest,
  USER_ROLE,
  validateRegisterForm,
  filterAndSortProducts,
  type ProductSortKey
} from '@terravision/shared';
import type { AuthResponse } from '../../types/auth';
import { arSessionService } from '../../services/arSessionService';
import { mapArSessionSaveError } from '../ar/arSessionErrors';
import { getMobileLoginPortalConfig } from '../auth/loginPortalConfig';
import { AppointmentStatus } from '../../types/appointment';
import type { CareActionType } from '@terravision/shared';

const initialState: MobileAppState = {
  authMode: 'login',
  firstName: '',
  lastName: '',
  confirmPassword: '',
  email: '',
  password: '',
  loggedIn: false,
  isAdmin: false,
  role: null,
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
  themeMode: 'light',
  activeSection: 'products',
  loginPortal: null,
  profile: null
};

function defaultSectionForRole(role: number | null): MobileAppState['activeSection'] {
  if (role === USER_ROLE.Consultant) {
    return 'appointments';
  }
  return 'products';
}

export function useMobileAppController() {
  const [state, setState] = useState<MobileAppState>(initialState);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'degraded' | 'offline'>('offline');
  const [cartErrorMessage, setCartErrorMessage] = useState<string | null>(null);
  const [orderErrorMessage, setOrderErrorMessage] = useState<string | null>(null);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  const [appointmentConsultantId, setAppointmentConsultantId] = useState('2');
  const [appointmentDateTime, setAppointmentDateTime] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [appointmentErrorMessage, setAppointmentErrorMessage] = useState<string | null>(null);
  const [appointmentSuccessMessage, setAppointmentSuccessMessage] = useState<string | null>(null);
  const [appointmentFilterStatus, setAppointmentFilterStatus] = useState<'all' | AppointmentStatus>('all');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryId, setProductCategoryId] = useState<number | null>(null);
  const [productArOnly, setProductArOnly] = useState(false);
  const [productInStockOnly, setProductInStockOnly] = useState(false);
  const [productSort, setProductSort] = useState<ProductSortKey>('relevance');
  const [detailProductId, setDetailProductId] = useState<number | null>(null);
  const [careErrorMessage, setCareErrorMessage] = useState<string | null>(null);
  const [careSuccessMessage, setCareSuccessMessage] = useState<string | null>(null);
  const [careMutatingKey, setCareMutatingKey] = useState<string | null>(null);
  const [arUploadErrorMessage, setArUploadErrorMessage] = useState<string | null>(null);
  const [arUploadSuccessMessage, setArUploadSuccessMessage] = useState<string | null>(null);
  const [arUploadProgress, setArUploadProgress] = useState(0);
  const [isArUploading, setIsArUploading] = useState(false);
  const [isArSessionSaving, setIsArSessionSaving] = useState(false);
  const [arSessionSaveProgress, setArSessionSaveProgress] = useState(0);
  const [arSessionSaveError, setArSessionSaveError] = useState<string | null>(null);
  const [arSessionSaveSuccess, setArSessionSaveSuccess] = useState<string | null>(null);
  const unauthorizedAlertShownRef = useRef(false);
  const cartEventSeenRef = useRef(new Set<string>());
  const cartEventOrderRef = useRef<string[]>([]);
  const orderCreatedSeenRef = useRef(new Set<string>());
  const orderCreatedOrderRef = useRef<string[]>([]);
  const orderStatusSeenRef = useRef(new Set<string>());
  const orderStatusOrderRef = useRef<string[]>([]);
  const queryClient = useQueryClient();
  const {
    productsQuery,
    categoriesQuery,
    cartQuery,
    ordersQuery,
    appointmentsQuery,
    createAppointmentMutation,
    updateAppointmentStatusMutation,
    addItemMutation,
    updateItemMutation,
    removeItemMutation,
    clearCartMutation,
    placeOrderMutation,
    careCalendarQuery,
    arSessionsQuery,
    completeCareActionMutation
  } = useCommerceQueries(state.loggedIn, state.role);

  const isLoginDisabled = useMemo(() => !state.email || !state.password, [state.email, state.password]);
  const isRegisterDisabled = useMemo(
    () =>
      !state.firstName.trim() ||
      !state.lastName.trim() ||
      !state.email.trim() ||
      !state.password ||
      !state.confirmPassword,
    [state.firstName, state.lastName, state.email, state.password, state.confirmPassword]
  );
  const arPendingProducts = useMemo(
    () => (productsQuery.data ?? []).filter((x) => !x.isArCompatible).sort((a, b) => a.name.localeCompare(b.name)),
    [productsQuery.data]
  );
  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts(productsQuery.data ?? [], {
        search: productSearch,
        categoryId: productCategoryId,
        arOnly: productArOnly,
        inStockOnly: productInStockOnly,
        sort: productSort
      }),
    [productsQuery.data, productSearch, productCategoryId, productArOnly, productInStockOnly, productSort]
  );
  const detailProduct = useMemo(
    () => (detailProductId == null ? null : (productsQuery.data ?? []).find((x) => x.id === detailProductId) ?? null),
    [productsQuery.data, detailProductId]
  );
  const canUploadArModel = useMemo(
    () =>
      state.isAdmin &&
      arPendingProducts.length > 0 &&
      state.selectedUploadProductId !== null &&
      state.selectedUploadFile !== null,
    [state.isAdmin, arPendingProducts.length, state.selectedUploadProductId, state.selectedUploadFile]
  );
  const palette = useMemo(() => getPalette(state.themeMode), [state.themeMode]);
  const activePillStyle = useMemo(
    () => ({ backgroundColor: palette.secondaryContainer, borderColor: palette.secondaryContainer }),
    [palette.secondaryContainer]
  );
  const activePillTextStyle = useMemo(() => ({ color: palette.onSecondaryContainer }), [palette.onSecondaryContainer]);
  const filteredAppointments = useMemo(() => {
    const items = appointmentsQuery.data ?? [];
    if (appointmentFilterStatus === 'all') {
      return items;
    }
    return items.filter((x) => x.status === appointmentFilterStatus);
  }, [appointmentsQuery.data, appointmentFilterStatus]);

  const appointmentInsight = useMemo(() => {
    const items = appointmentsQuery.data ?? [];
    const completed = items.filter((x) => x.status === 3).length;
    const avgDurationMins =
      items.length === 0
        ? 45
        : Math.round(
            items.reduce((acc, a) => acc + (30 + (Math.abs(a.id) % 4) * 15), 0) / items.length
          );
    return { completed, avgDurationMins };
  }, [appointmentsQuery.data]);

  const setEmail = (email: string) => setState((prev) => ({ ...prev, email }));
  const setPassword = (password: string) => setState((prev) => ({ ...prev, password }));
  const setActiveSection = (activeSection: MobileSection) => {
    setOrderSuccessMessage(null);
    setAppointmentSuccessMessage(null);
    setAppointmentErrorMessage(null);
    setCareSuccessMessage(null);
    setCareErrorMessage(null);
    setState((prev) => ({ ...prev, activeSection }));
  };
  const toggleTheme = () =>
    setState((prev) => ({ ...prev, themeMode: prev.themeMode === 'dark' ? ('light' as ThemeMode) : ('dark' as ThemeMode) }));
  const setIsArPreviewVisible = (isArPreviewVisible: boolean) =>
    setState((prev) => ({ ...prev, isArPreviewVisible }));
  const setIsArExperienceVisible = (isArExperienceVisible: boolean) => {
    if (isArExperienceVisible) {
      setArSessionSaveError(null);
      setArSessionSaveSuccess(null);
      setArSessionSaveProgress(0);
    }
    setState((prev) => ({ ...prev, isArExperienceVisible }));
  };
  const syncRealtimeSubscriptions = useCallback(() => {
    const unsubscribeStatus = realtimeService.onStatusChanged((status) => {
      setRealtimeStatus(status);
    });
    const unsubscribeCart = realtimeService.onCartChanged((event) => {
      const key = `${event.action}:${event.productId}:${event.quantity}`;
      setState((prev) => ({
        ...prev,
        events: pushUniqueEvent(prev.events, event, key, cartEventSeenRef.current, cartEventOrderRef.current, 25)
      }));
      queryClient.invalidateQueries({ queryKey: ['cart'] }).catch(() => undefined);
    });
    const unsubscribeCreated = realtimeService.onOrderCreated((event) => {
      const key = `${event.orderId}:${event.status}:${event.totalAmount}`;
      setState((prev) => ({
        ...prev,
        orderCreatedEvents: pushUniqueEvent(
          prev.orderCreatedEvents,
          event,
          key,
          orderCreatedSeenRef.current,
          orderCreatedOrderRef.current,
          25
        )
      }));
      queryClient.invalidateQueries({ queryKey: ['orders'] }).catch(() => undefined);
    });
    const unsubscribeOrderStatus = realtimeService.onOrderStatusChanged((event) => {
      const key = `${event.orderId}:${event.previousStatus}:${event.newStatus}`;
      setState((prev) => ({
        ...prev,
        orderStatusEvents: pushUniqueEvent(
          prev.orderStatusEvents,
          event,
          key,
          orderStatusSeenRef.current,
          orderStatusOrderRef.current,
          25
        )
      }));
      queryClient.invalidateQueries({ queryKey: ['orders'] }).catch(() => undefined);
      if (event.newStatus === 4) {
        queryClient.invalidateQueries({ queryKey: ['care'] }).catch(() => undefined);
      }
    });
    const unsubscribeReconnect = realtimeService.onReconnected(() => {
      void syncQueriesOnReconnect((filters) => queryClient.invalidateQueries(filters));
    });
    return () => {
      unsubscribeStatus();
      unsubscribeCart();
      unsubscribeCreated();
      unsubscribeOrderStatus();
      unsubscribeReconnect();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!state.loggedIn) {
      return;
    }

    let disposed = false;
    let unsubscribe = () => {};
    (async () => {
      try {
        setRealtimeStatus('connecting');
        await realtimeService.connect();
        if (!disposed) {
          setRealtimeStatus('connected');
          unsubscribe = syncRealtimeSubscriptions();
        }
      } catch {
        setRealtimeStatus('offline');
        Alert.alert(
          'Canlı bağlantı',
          'Birkaç yeniden denemeden sonra canlı kanal açılamadı. Veriler REST ile gelmeye devam eder; ağ düzelince çıkış yapıp tekrar giriş deneyebilirsiniz.'
        );
      }
    })();

    return () => {
      disposed = true;
      unsubscribe();
      realtimeService.disconnect().catch(() => undefined);
      setRealtimeStatus('offline');
    };
  }, [state.loggedIn, syncRealtimeSubscriptions]);

  useEffect(() => {
    onUnauthorized(() => {
      if (!unauthorizedAlertShownRef.current) {
        Alert.alert('Oturum', AUTH_UI_MESSAGES.sessionExpired);
        unauthorizedAlertShownRef.current = true;
      }
      queryClient.clear();
      realtimeService.disconnect().catch(() => undefined);
      setRealtimeStatus('offline');
      setState((prev) => buildPostLogoutState(initialState, prev));
    });
  }, [queryClient]);

  useEffect(() => {
    (async () => {
      const status = await getSessionRestoreStatus();
      if (status === 'none') {
        return;
      }
      if (status === 'partial') {
        Alert.alert('Oturum', AUTH_UI_MESSAGES.sessionPartial);
        return;
      }
      const profile = await tokenStore.getProfile();
      setState((prev) => ({
        ...prev,
        loggedIn: true,
        profile,
        role: profile?.role ?? prev.role,
        isAdmin: profile?.role === USER_ROLE.Admin,
        activeSection: defaultSectionForRole(profile?.role ?? null)
      }));
    })();
  }, []);

  useEffect(() => {
    if (state.selectedUploadProductId !== null || arPendingProducts.length === 0) {
      return;
    }
    setState((prev) => ({ ...prev, selectedUploadProductId: arPendingProducts[0].id }));
  }, [arPendingProducts, state.selectedUploadProductId]);

  const completeAuthSession = async (auth: AuthResponse, portal: LoginPortal): Promise<boolean> => {
    if (!roleMatchesPortal(auth.role, portal)) {
      await authService.logout();
      Alert.alert('Hesap türü uyuşmuyor', portalRoleMismatchMessage(portal));
      return false;
    }

    const profile: UserProfile = {
      userId: auth.userId,
      firstName: auth.firstName,
      lastName: auth.lastName,
      email: auth.email,
      role: auth.role
    };
    await tokenStore.setProfile(profile);

    setState((prev) => ({
      ...prev,
      isAdmin: auth.role === USER_ROLE.Admin,
      role: auth.role,
      loggedIn: true,
      authMode: 'login',
      profile,
      activeSection: defaultSectionForRole(auth.role)
    }));
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['cart'] }),
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
      queryClient.invalidateQueries({ queryKey: ['appointments'] }),
      queryClient.invalidateQueries({ queryKey: ['care'] })
    ]);
    return true;
  };

  const handleLogin = async () => {
    if (!state.loginPortal) {
      Alert.alert('Giriş', 'Önce müşteri, danışman veya yönetici giriş türünü seçin.');
      return;
    }

    try {
      const auth = await authService.login({ email: state.email, password: state.password });
      await completeAuthSession(auth, state.loginPortal);
    } catch {
      Alert.alert('Giriş başarısız', AUTH_UI_MESSAGES.loginFailed);
    }
  };

  const handleRegister = async () => {
    if (state.loginPortal !== 'customer') {
      Alert.alert('Kayıt', 'Yeni hesap yalnızca müşteri girişi için oluşturulabilir.');
      return;
    }

    const validation = validateRegisterForm({
      firstName: state.firstName,
      lastName: state.lastName,
      email: state.email,
      password: state.password,
      confirmPassword: state.confirmPassword
    });
    if (!validation.ok) {
      Alert.alert('Kayıt', validation.message);
      return;
    }

    try {
      const auth = await authService.register(
        toCustomerRegisterRequest({
          firstName: state.firstName,
          lastName: state.lastName,
          email: state.email,
          password: state.password,
          confirmPassword: state.confirmPassword
        })
      );
      await completeAuthSession(auth, 'customer');
    } catch (error) {
      Alert.alert(
        'Kayıt başarısız',
        toStatusMessage(error, AUTH_UI_MESSAGES.registerFailed, {
          400: 'Bu e-posta zaten kayıtlı olabilir veya bilgiler geçersiz.',
          409: 'Bu e-posta zaten kayıtlı.'
        })
      );
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    await realtimeService.disconnect();
    queryClient.clear();
    setRealtimeStatus('offline');
    unauthorizedAlertShownRef.current = false;
    setState((prev) => buildPostLogoutState(initialState, prev));
  };

  const handleAddToCart = async (productId: number) => {
    setCartErrorMessage(null);
    try {
      await addItemMutation.mutateAsync(productId);
    } catch (error) {
      setCartErrorMessage(
        toStatusMessage(error, 'Sepete ekleme başarısız.', {
          400: 'Geçersiz sepet isteği. Ürün veya adet bilgisini kontrol edin.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          404: 'Ürün bulunamadı.',
          409: 'Stok yeterli değil.'
        })
      );
    }
  };

  const handleIncreaseQuantity = async (productId: number, currentQuantity: number) => {
    setCartErrorMessage(null);
    try {
      await updateItemMutation.mutateAsync({ productId, quantity: currentQuantity + 1 });
    } catch (error) {
      setCartErrorMessage(
        toStatusMessage(error, 'Adet artırılamadı.', {
          400: 'Adet güncellenemedi. Geçerli miktar girin.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          404: 'Sepet ürünü bulunamadı.',
          409: 'Stok sınırı aşıldı.'
        })
      );
    }
  };

  const handleDecreaseQuantity = async (productId: number, currentQuantity: number) => {
    setCartErrorMessage(null);
    try {
      await updateItemMutation.mutateAsync({ productId, quantity: Math.max(currentQuantity - 1, 0) });
    } catch (error) {
      setCartErrorMessage(
        toStatusMessage(error, 'Adet azaltılamadı.', {
          400: 'Adet güncellenemedi.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          404: 'Sepet ürünü bulunamadı.'
        })
      );
    }
  };

  const handleRemoveItem = async (productId: number) => {
    setCartErrorMessage(null);
    try {
      await removeItemMutation.mutateAsync(productId);
    } catch (error) {
      setCartErrorMessage(
        toStatusMessage(error, 'Ürün sepetten kaldırılamadı.', {
          401: AUTH_UI_MESSAGES.sessionExpired,
          404: 'Kaldırılacak ürün bulunamadı.'
        })
      );
    }
  };

  const handleClearCart = async () => {
    setCartErrorMessage(null);
    try {
      await clearCartMutation.mutateAsync();
    } catch (error) {
      setCartErrorMessage(
        toStatusMessage(error, 'Sepet temizlenemedi.', {
          401: AUTH_UI_MESSAGES.sessionExpired,
          500: 'Sunucu hatası nedeniyle sepet temizlenemedi.'
        })
      );
    }
  };

  const handlePlaceOrder = async () => {
    setOrderErrorMessage(null);
    setOrderSuccessMessage(null);
    try {
      const order = await placeOrderMutation.mutateAsync('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['cart'] })
      ]);
      setOrderSuccessMessage(`Sipariş #${order.id} oluşturuldu.`);
      setState((prev) => ({ ...prev, activeSection: 'orders' }));
      Alert.alert('Sipariş oluşturuldu', `Sipariş #${order.id} başarıyla oluşturuldu.`);
    } catch (error) {
      setOrderErrorMessage(
        toStatusMessage(error, 'Sipariş oluşturulamadı.', {
          400: 'Sipariş oluşturulamadı: Sepet boş olabilir.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          409: 'Sipariş oluşturulamadı: Stok yetersiz.',
          500: 'Sunucu hatası nedeniyle sipariş oluşturulamadı.'
        })
      );
    }
  };

  const handleCreateAppointment = async () => {
    setAppointmentErrorMessage(null);
    setAppointmentSuccessMessage(null);
    if (state.role !== 1) {
      setAppointmentErrorMessage('Randevu oluşturma yalnızca müşteri hesabı ile yapılabilir.');
      return;
    }
    const consultantId = Number(appointmentConsultantId);
    if (!Number.isInteger(consultantId) || consultantId <= 0) {
      setAppointmentErrorMessage('Geçerli bir danışman numarası girin.');
      return;
    }
    const appointmentDate = appointmentDateTime.trim();
    if (!appointmentDate) {
      setAppointmentErrorMessage('Randevu tarihi gereklidir.');
      return;
    }

    try {
      const created = await createAppointmentMutation.mutateAsync({
        consultantId,
        appointmentDate,
        notes: appointmentNotes.trim()
      });
      setAppointmentSuccessMessage(`Randevu #${created.id} oluşturuldu.`);
      setAppointmentDateTime('');
      setAppointmentNotes('');
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    } catch (error) {
      setAppointmentErrorMessage(
        toStatusMessage(error, 'Randevu oluşturulamadı.', {
          400: 'Geçersiz randevu isteği. Tarih ve danışman bilgisini kontrol edin.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          403: 'Bu işlem için müşteri yetkisi gerekiyor.',
          404: 'Danışman bulunamadı.'
        })
      );
    }
  };

  const handleUpdateAppointmentStatus = async (id: number, status: AppointmentStatus) => {
    setAppointmentErrorMessage(null);
    setAppointmentSuccessMessage(null);
    if (state.role !== 2 && state.role !== 3) {
      setAppointmentErrorMessage('Durum güncelleme yalnızca danışman veya yönetici hesaplarında açıktır.');
      return;
    }
    try {
      const updated = await updateAppointmentStatusMutation.mutateAsync({ id, status });
      setAppointmentSuccessMessage(`Randevu #${updated.id} durumu güncellendi.`);
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    } catch (error) {
      setAppointmentErrorMessage(
        toStatusMessage(error, 'Randevu durumu güncellenemedi.', {
          400: 'Durum güncelleme isteği geçersiz.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          403: 'Bu işlem için danışman veya yönetici yetkisi gerekiyor.',
          404: 'Randevu bulunamadı.'
        })
      );
    }
  };

  const handleCompleteCareAction = async (calendarId: number, actionType: CareActionType) => {
    const key = `${calendarId}-${actionType}`;
    setCareMutatingKey(key);
    setCareErrorMessage(null);
    setCareSuccessMessage(null);
    if (state.role !== USER_ROLE.Customer) {
      setCareErrorMessage('Bakım takvimi yalnızca müşteri hesapları içindir.');
      setCareMutatingKey(null);
      return;
    }
    try {
      await completeCareActionMutation.mutateAsync({ calendarId, actionType });
      setCareSuccessMessage('Bakım görevi kaydedildi; sonraki tarih güncellendi.');
    } catch (error) {
      setCareErrorMessage(
        toStatusMessage(error, 'Bakım görevi kaydedilemedi.', {
          400: 'Geçersiz bakım isteği.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          403: 'Bu işlem için müşteri oturumu gerekiyor.',
          404: 'Bakım kaydı bulunamadı.'
        })
      );
    } finally {
      setCareMutatingKey(null);
    }
  };

  const handleSaveArLayout = async (params: {
    environmentNotes: string;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    rotationY: number;
    screenshot: { uri: string; name: string; type: string };
  }) => {
    if (state.role !== USER_ROLE.Customer) {
      Alert.alert('Yetki', 'AR odası kaydı yalnızca müşteri hesaplarında açıktır.');
      return;
    }
    if (!state.arPreview) {
      return;
    }

    setArSessionSaveError(null);
    setArSessionSaveSuccess(null);
    try {
      setIsArSessionSaving(true);
      setArSessionSaveProgress(0);
      await arSessionService.saveSession(
        {
          productId: state.arPreview.productId,
          deviceModel: `${Platform.OS} ${String(Platform.Version)}`,
          scaleX: params.scaleX,
          scaleY: params.scaleY,
          scaleZ: params.scaleZ,
          rotationY: params.rotationY,
          environmentNotes: params.environmentNotes,
          screenshot: params.screenshot
        },
        { onProgress: (percent) => setArSessionSaveProgress(percent) }
      );
      setArSessionSaveProgress(100);
      setArSessionSaveSuccess('Tasarım odanıza kaydedildi.');
      await queryClient.invalidateQueries({ queryKey: ['ar', 'sessions', 'me'] });
      Alert.alert('Başarılı', 'AR yerleşiminiz kaydedildi. Profilinizden veya web AR Odalarım sayfasından görüntüleyebilirsiniz.');
    } catch (error) {
      setArSessionSaveError(mapArSessionSaveError(error));
    } finally {
      setIsArSessionSaving(false);
    }
  };

  const handlePreviewAr = async (productId: number) => {
    try {
      const preview = await arService.getProductPreview(productId);
      setState((prev) => ({ ...prev, arPreview: preview, isArPreviewVisible: true }));
    } catch (error) {
      Alert.alert(
        'AR önizleme',
        toStatusMessage(error, 'AR önizleme bilgisi alınamadı.', {
          401: AUTH_UI_MESSAGES.sessionExpired,
          404: 'Bu ürün için AR modeli bulunamadı.',
          500: 'Sunucu hatası nedeniyle AR önizleme açılamadı.'
        })
      );
    }
  };

  const handleUploadArModel = async () => {
    setArUploadErrorMessage(null);
    setArUploadSuccessMessage(null);
    try {
      if (!state.selectedUploadProductId || state.selectedUploadProductId <= 0) {
        Alert.alert('Doğrulama', 'Önce bir ürün seçin.');
        return;
      }
      if (!state.selectedUploadFile) {
        Alert.alert('Doğrulama', 'Önce bir dosya seçin.');
        return;
      }

      setIsArUploading(true);
      setArUploadProgress(0);
      const result = await mediaService.uploadArModelForProduct(state.selectedUploadProductId, state.selectedUploadFile, {
        onProgress: (percent) => setArUploadProgress(percent)
      });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      const refreshedProducts = await productService.getProducts();
      const pendingProduct = refreshedProducts.filter((x) => !x.isArCompatible).sort((a, b) => a.name.localeCompare(b.name))[0];

      setState((prev) => ({
        ...prev,
        selectedUploadProductId: pendingProduct?.id ?? null,
        selectedUploadFile: null
      }));

      setArUploadProgress(100);
      setArUploadSuccessMessage(`Model bağlandı: ${result.uploaded.fileName}`);
      Alert.alert('Yükleme başarılı', `Dosya: ${result.uploaded.fileName}\nÜrün: ${result.product?.name ?? '—'}`);
    } catch (error) {
      setArUploadErrorMessage(
        toStatusMessage(error, 'AR model yüklemesi başarısız.', {
          400: 'Yükleme reddedildi. Dosya formatı veya boyutu geçerli olmayabilir.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          403: 'Bu işlem için yönetici yetkisi gerekiyor.',
          404: 'Ürün bulunamadı.',
          413: 'Dosya çok büyük. Maksimum 25MB yükleyebilirsiniz.',
          415: 'Desteklenmeyen dosya tipi.',
          500: 'Sunucu hatası nedeniyle AR modeli yüklenemedi.'
        })
      );
    } finally {
      setIsArUploading(false);
    }
  };

  const handleClearSelectedArFile = () => {
    setArUploadErrorMessage(null);
    setArUploadSuccessMessage(null);
    setArUploadProgress(0);
    setState((prev) => ({ ...prev, selectedUploadFile: null }));
  };

  const handlePickArFile = async () => {
    try {
      setArUploadErrorMessage(null);
      setArUploadSuccessMessage(null);
      const pickedFiles = await pick({
        type: ['model/gltf+json', 'model/vnd.usdz+zip', 'application/octet-stream']
      });
      const pickedFile = pickedFiles[0];
      if (!pickedFile) {
        return;
      }
      const validationError = validateArUploadFile({
        name: pickedFile.name,
        type: pickedFile.type,
        size: typeof pickedFile.size === 'number' ? pickedFile.size : undefined
      });
      if (validationError) {
        Alert.alert('Dosya doğrulama', validationError);
        setArUploadErrorMessage(validationError);
        return;
      }
      setState((prev) => ({
        ...prev,
        selectedUploadFile: {
          uri: pickedFile.uri,
          name: pickedFile.name ?? `model-${Date.now()}`,
          type:
            pickedFile.type ??
            (pickedFile.name?.toLowerCase().endsWith('.usdz') ? 'model/vnd.usdz+zip' : 'model/gltf+json')
        }
      }));
    } catch (error) {
      if (!isErrorWithCode(error) || error.code !== errorCodes.OPERATION_CANCELED) {
        Alert.alert('Dosya hatası', 'Dosya seçilemedi.');
      }
    }
  };

  const setSelectedUploadProductId = (value: number | null) =>
    setState((prev) => ({ ...prev, selectedUploadProductId: value }));

  const openProductDetail = (productId: number) => setDetailProductId(productId);
  const closeProductDetail = () => setDetailProductId(null);
  const clearProductFilters = () => {
    setProductSearch('');
    setProductCategoryId(null);
    setProductArOnly(false);
    setProductInStockOnly(false);
    setProductSort('relevance');
  };

  const selectLoginPortal = (portal: LoginPortal, authMode: MobileAppState['authMode'] = 'login') => {
    const config = getMobileLoginPortalConfig(portal);
    setState((prev) => ({
      ...prev,
      loginPortal: portal,
      authMode: portal === 'customer' ? authMode : 'login',
      email: authMode === 'register' ? '' : config.defaultEmail,
      password: authMode === 'register' ? '' : config.defaultPassword,
      firstName: '',
      lastName: '',
      confirmPassword: ''
    }));
  };

  const openCustomerRegister = () => selectLoginPortal('customer', 'register');

  const setAuthMode = (authMode: MobileAppState['authMode']) =>
    setState((prev) => ({
      ...prev,
      authMode,
      email: authMode === 'register' ? '' : prev.email,
      password: authMode === 'register' ? '' : prev.password,
      firstName: '',
      lastName: '',
      confirmPassword: ''
    }));

  const clearLoginPortal = () =>
    setState((prev) => ({
      ...prev,
      loginPortal: null,
      authMode: 'login',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      confirmPassword: ''
    }));

  return {
    state: {
      ...state,
      products: productsQuery.data ?? [],
      cart: cartQuery.data ?? null,
      orders: ordersQuery.data ?? [],
      appointments: filteredAppointments
    },
    palette,
    isLoginDisabled,
    isRegisterDisabled,
    arPendingProducts,
    filteredProducts,
    detailProduct,
    categories: categoriesQuery.data ?? [],
    productSearch,
    productCategoryId,
    productArOnly,
    productInStockOnly,
    productSort,
    setProductSearch,
    setProductCategoryId,
    setProductArOnly,
    setProductInStockOnly,
    setProductSort,
    clearProductFilters,
    openProductDetail,
    closeProductDetail,
    canUploadArModel,
    carePlants: careCalendarQuery.data?.plants ?? [],
    arSessions: arSessionsQuery.data ?? [],
    isArSessionsLoading: state.role === USER_ROLE.Customer && arSessionsQuery.isLoading,
    isArSessionsRefreshing: arSessionsQuery.isFetching && !arSessionsQuery.isLoading,
    arSessionsErrorMessage:
      state.role === USER_ROLE.Customer && arSessionsQuery.error ? 'AR odaları yüklenemedi.' : null,
    refreshArSessions: () => {
      void arSessionsQuery.refetch();
    },
    isCommerceLoading:
      productsQuery.isLoading ||
      cartQuery.isLoading ||
      ordersQuery.isLoading ||
      (state.role !== null && appointmentsQuery.isLoading) ||
      (state.role === USER_ROLE.Customer && careCalendarQuery.isLoading),
    commerceError:
      productsQuery.error ??
      cartQuery.error ??
      ordersQuery.error ??
      appointmentsQuery.error ??
      (state.role === USER_ROLE.Customer ? careCalendarQuery.error : null) ??
      null,
    isCartMutating:
      addItemMutation.isPending ||
      updateItemMutation.isPending ||
      removeItemMutation.isPending ||
      clearCartMutation.isPending,
    isOrderMutating: placeOrderMutation.isPending,
    isAppointmentMutating: createAppointmentMutation.isPending || updateAppointmentStatusMutation.isPending,
    isCareMutating: completeCareActionMutation.isPending,
    careMutatingKey,
    careErrorMessage,
    careSuccessMessage,
    totalAppointmentsCount: (appointmentsQuery.data ?? []).length,
    pendingAppointmentsCount: (appointmentsQuery.data ?? []).filter((x) => x.status === 1).length,
    completedAppointmentsCount: appointmentInsight.completed,
    averageAppointmentDurationMins: appointmentInsight.avgDurationMins,
    appointmentConsultantId,
    appointmentDateTime,
    appointmentNotes,
    appointmentFilterStatus,
    appointmentErrorMessage,
    appointmentSuccessMessage,
    cartErrorMessage,
    orderErrorMessage,
    orderSuccessMessage,
    arUploadErrorMessage,
    arUploadSuccessMessage,
    arUploadProgress,
    isArUploading,
    isArSessionSaving,
    arSessionSaveProgress,
    arSessionSaveError,
    arSessionSaveSuccess,
    handleSaveArLayout,
    realtimeStatus,
    activePillStyle,
    activePillTextStyle,
    setEmail,
    setPassword,
    setFirstName: (value: string) => setState((prev) => ({ ...prev, firstName: value })),
    setLastName: (value: string) => setState((prev) => ({ ...prev, lastName: value })),
    setConfirmPassword: (value: string) => setState((prev) => ({ ...prev, confirmPassword: value })),
    setAuthMode,
    openCustomerRegister,
    selectLoginPortal,
    clearLoginPortal,
    setActiveSection,
    toggleTheme,
    setIsArPreviewVisible,
    setIsArExperienceVisible,
    setSelectedUploadProductId,
    handleLogin,
    handleRegister,
    handleLogout,
    handleAddToCart,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleRemoveItem,
    handleClearCart,
    handlePlaceOrder,
    setAppointmentConsultantId,
    setAppointmentDateTime,
    setAppointmentNotes,
    setAppointmentFilterStatus,
    handleCreateAppointment,
    handleUpdateAppointmentStatus,
    handleCompleteCareAction,
    handlePreviewAr,
    handleUploadArModel,
    handlePickArFile,
    handleClearSelectedArFile
  };
}
