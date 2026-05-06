import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { errorCodes, isErrorWithCode, pick } from '@react-native-documents/picker';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { realtimeService } from '../../services/realtimeService';
import { arService } from '../../services/arService';
import { mediaService } from '../../services/mediaService';
import { productService } from '../../services/productService';
import { onUnauthorized } from '../../services/apiClient';
import { MobileSection, MobileAppState, ThemeMode } from './types';
import { getPalette } from '../../theme/mobileTheme';
import { useCommerceQueries } from './useCommerceQueries';
import { validateArUploadFile } from '../ar/arUploadValidation';
import { AUTH_UI_MESSAGES, buildPostLogoutState, getSessionRestoreStatus } from '../auth/session';
import { pushUniqueEvent } from '../realtime/eventDedup';
import { toStatusMessage } from '../../ui/httpError';

const initialState: MobileAppState = {
  email: 'admin@terravision.com',
  password: 'admin123',
  loggedIn: false,
  isAdmin: false,
  products: [],
  cart: null,
  orders: [],
  events: [],
  orderCreatedEvents: [],
  orderStatusEvents: [],
  arPreview: null,
  isArPreviewVisible: false,
  isArExperienceVisible: false,
  selectedUploadProductId: null,
  selectedUploadFile: null,
  themeMode: 'light',
  activeSection: 'products'
};

export function useMobileAppController() {
  const [state, setState] = useState<MobileAppState>(initialState);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'degraded' | 'offline'>('offline');
  const [cartErrorMessage, setCartErrorMessage] = useState<string | null>(null);
  const [orderErrorMessage, setOrderErrorMessage] = useState<string | null>(null);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  const [arUploadErrorMessage, setArUploadErrorMessage] = useState<string | null>(null);
  const [arUploadSuccessMessage, setArUploadSuccessMessage] = useState<string | null>(null);
  const [arUploadProgress, setArUploadProgress] = useState(0);
  const [isArUploading, setIsArUploading] = useState(false);
  const unauthorizedAlertShownRef = useRef(false);
  const cartEventSeenRef = useRef(new Set<string>());
  const cartEventOrderRef = useRef<string[]>([]);
  const orderCreatedSeenRef = useRef(new Set<string>());
  const orderCreatedOrderRef = useRef<string[]>([]);
  const orderStatusSeenRef = useRef(new Set<string>());
  const orderStatusOrderRef = useRef<string[]>([]);
  const queryClient = useQueryClient();
  const { productsQuery, cartQuery, ordersQuery, addItemMutation, updateItemMutation, removeItemMutation, clearCartMutation, placeOrderMutation } =
    useCommerceQueries(state.loggedIn);

  const isLoginDisabled = useMemo(() => !state.email || !state.password, [state.email, state.password]);
  const arPendingProducts = useMemo(
    () => (productsQuery.data ?? []).filter((x) => !x.isArCompatible).sort((a, b) => a.name.localeCompare(b.name)),
    [productsQuery.data]
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
    () => ({ backgroundColor: palette.button, borderColor: palette.button }),
    [palette.button]
  );
  const activePillTextStyle = useMemo(() => ({ color: palette.buttonText }), [palette.buttonText]);

  const setEmail = (email: string) => setState((prev) => ({ ...prev, email }));
  const setPassword = (password: string) => setState((prev) => ({ ...prev, password }));
  const setActiveSection = (activeSection: MobileSection) => {
    setOrderSuccessMessage(null);
    setState((prev) => ({ ...prev, activeSection }));
  };
  const toggleTheme = () =>
    setState((prev) => ({ ...prev, themeMode: prev.themeMode === 'dark' ? ('light' as ThemeMode) : ('dark' as ThemeMode) }));
  const setIsArPreviewVisible = (isArPreviewVisible: boolean) =>
    setState((prev) => ({ ...prev, isArPreviewVisible }));
  const setIsArExperienceVisible = (isArExperienceVisible: boolean) =>
    setState((prev) => ({ ...prev, isArExperienceVisible }));
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
    });
    return () => {
      unsubscribeStatus();
      unsubscribeCart();
      unsubscribeCreated();
      unsubscribeOrderStatus();
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
          'Realtime',
          'Birkac yeniden denemeden sonra canli kanal acilamadi. Veriler REST ile gelmeye devam eder; ag duzelince cikis yapip tekrar giris deneyebilirsiniz.'
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
        Alert.alert('Session', AUTH_UI_MESSAGES.sessionExpired);
        unauthorizedAlertShownRef.current = true;
      }
      queryClient.clear();
      realtimeService.disconnect().catch(() => undefined);
      setRealtimeStatus('offline');
      setState((prev) => ({ ...prev, loggedIn: false }));
    });
  }, [queryClient]);

  useEffect(() => {
    (async () => {
      const status = await getSessionRestoreStatus();
      if (status === 'none') {
        return;
      }
      if (status === 'partial') {
        Alert.alert('Session', AUTH_UI_MESSAGES.sessionPartial);
        return;
      }
      setState((prev) => ({ ...prev, loggedIn: true }));
    })();
  }, []);

  useEffect(() => {
    if (state.selectedUploadProductId !== null || arPendingProducts.length === 0) {
      return;
    }
    setState((prev) => ({ ...prev, selectedUploadProductId: arPendingProducts[0].id }));
  }, [arPendingProducts, state.selectedUploadProductId]);

  const handleLogin = async () => {
    try {
      const auth = await authService.login({ email: state.email, password: state.password });
      setState((prev) => ({
        ...prev,
        isAdmin: auth.role === 3,
        loggedIn: true
      }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['cart'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] })
      ]);
    } catch {
      Alert.alert('Login failed', AUTH_UI_MESSAGES.loginFailed);
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
        toStatusMessage(error, 'Sepete ekleme basarisiz.', {
          400: 'Gecersiz sepet istegi. Urun veya adet bilgisini kontrol edin.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          404: 'Urun bulunamadi.',
          409: 'Stok yeterli degil.'
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
        toStatusMessage(error, 'Adet artirilamadi.', {
          400: 'Adet guncellenemedi. Gecerli miktar girin.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          404: 'Sepet urunu bulunamadi.',
          409: 'Stok siniri asildi.'
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
        toStatusMessage(error, 'Adet azaltilamadi.', {
          400: 'Adet guncellenemedi.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          404: 'Sepet urunu bulunamadi.'
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
        toStatusMessage(error, 'Urun sepetten kaldirilamadi.', {
          401: AUTH_UI_MESSAGES.sessionExpired,
          404: 'Kaldirilacak urun bulunamadi.'
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
          500: 'Sunucu hatasi nedeniyle sepet temizlenemedi.'
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
      setOrderSuccessMessage(`Siparis #${order.id} olusturuldu.`);
      setState((prev) => ({ ...prev, activeSection: 'orders' }));
      Alert.alert('Order Created', `Order #${order.id} created successfully.`);
    } catch (error) {
      setOrderErrorMessage(
        toStatusMessage(error, 'Siparis olusturulamadi.', {
          400: 'Siparis olusturulamadi: Sepet bos olabilir.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          409: 'Siparis olusturulamadi: Stok yetersiz.',
          500: 'Sunucu hatasi nedeniyle siparis olusturulamadi.'
        })
      );
    }
  };

  const handlePreviewAr = async (productId: number) => {
    try {
      const preview = await arService.getProductPreview(productId);
      setState((prev) => ({ ...prev, arPreview: preview, isArPreviewVisible: true }));
    } catch (error) {
      Alert.alert(
        'AR Preview',
        toStatusMessage(error, 'AR onizleme bilgisi alinamadi.', {
          401: AUTH_UI_MESSAGES.sessionExpired,
          404: 'Bu urun icin AR modeli bulunamadi.',
          500: 'Sunucu hatasi nedeniyle AR onizleme acilamadi.'
        })
      );
    }
  };

  const handleUploadArModel = async () => {
    setArUploadErrorMessage(null);
    setArUploadSuccessMessage(null);
    try {
      if (!state.selectedUploadProductId || state.selectedUploadProductId <= 0) {
        Alert.alert('Validation', 'Once bir urun secin.');
        return;
      }
      if (!state.selectedUploadFile) {
        Alert.alert('Validation', 'Once bir dosya secin.');
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
      setArUploadSuccessMessage(`Model baglandi: ${result.uploaded.fileName}`);
      Alert.alert('Upload Successful', `File: ${result.uploaded.fileName}\nProduct: ${result.product?.name ?? 'N/A'}`);
    } catch (error) {
      setArUploadErrorMessage(
        toStatusMessage(error, 'AR model upload basarisiz.', {
          400: 'Yukleme reddedildi. Dosya formati veya boyutu gecerli olmayabilir.',
          401: AUTH_UI_MESSAGES.sessionExpired,
          403: 'Bu islem icin admin yetkisi gerekiyor.',
          404: 'URun bulunamadi.',
          413: 'Dosya cok buyuk. Maksimum 25MB yukleyebilirsiniz.',
          415: 'Desteklenmeyen dosya tipi.',
          500: 'Sunucu hatasi nedeniyle AR modeli yuklenemedi.'
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
        Alert.alert('File Validation', validationError);
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
        Alert.alert('File Error', 'Dosya secilemedi.');
      }
    }
  };

  const setSelectedUploadProductId = (value: number | null) =>
    setState((prev) => ({ ...prev, selectedUploadProductId: value }));

  return {
    state: {
      ...state,
      products: productsQuery.data ?? [],
      cart: cartQuery.data ?? null,
      orders: ordersQuery.data ?? []
    },
    palette,
    isLoginDisabled,
    arPendingProducts,
    canUploadArModel,
    isCommerceLoading: productsQuery.isLoading || cartQuery.isLoading || ordersQuery.isLoading,
    commerceError: productsQuery.error ?? cartQuery.error ?? ordersQuery.error ?? null,
    isCartMutating:
      addItemMutation.isPending ||
      updateItemMutation.isPending ||
      removeItemMutation.isPending ||
      clearCartMutation.isPending,
    isOrderMutating: placeOrderMutation.isPending,
    cartErrorMessage,
    orderErrorMessage,
    orderSuccessMessage,
    arUploadErrorMessage,
    arUploadSuccessMessage,
    arUploadProgress,
    isArUploading,
    realtimeStatus,
    activePillStyle,
    activePillTextStyle,
    setEmail,
    setPassword,
    setActiveSection,
    toggleTheme,
    setIsArPreviewVisible,
    setIsArExperienceVisible,
    setSelectedUploadProductId,
    handleLogin,
    handleLogout,
    handleAddToCart,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleRemoveItem,
    handleClearCart,
    handlePlaceOrder,
    handlePreviewAr,
    handleUploadArModel,
    handlePickArFile,
    handleClearSelectedArFile
  };
}
