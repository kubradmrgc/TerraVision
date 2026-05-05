import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { hasStoredSession } from '../auth/session';

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
  const setActiveSection = (activeSection: MobileSection) => setState((prev) => ({ ...prev, activeSection }));
  const toggleTheme = () =>
    setState((prev) => ({ ...prev, themeMode: prev.themeMode === 'dark' ? ('light' as ThemeMode) : ('dark' as ThemeMode) }));
  const setIsArPreviewVisible = (isArPreviewVisible: boolean) =>
    setState((prev) => ({ ...prev, isArPreviewVisible }));
  const setIsArExperienceVisible = (isArExperienceVisible: boolean) =>
    setState((prev) => ({ ...prev, isArExperienceVisible }));
  const syncRealtimeSubscriptions = useCallback(() => {
    const unsubscribeCart = realtimeService.onCartChanged((event) => {
      setState((prev) => ({ ...prev, events: [event, ...prev.events].slice(0, 25) }));
      queryClient.invalidateQueries({ queryKey: ['cart'] }).catch(() => undefined);
    });
    const unsubscribeCreated = realtimeService.onOrderCreated((event) => {
      setState((prev) => ({ ...prev, orderCreatedEvents: [event, ...prev.orderCreatedEvents].slice(0, 25) }));
      queryClient.invalidateQueries({ queryKey: ['orders'] }).catch(() => undefined);
    });
    const unsubscribeStatus = realtimeService.onOrderStatusChanged((event) => {
      setState((prev) => ({ ...prev, orderStatusEvents: [event, ...prev.orderStatusEvents].slice(0, 25) }));
      queryClient.invalidateQueries({ queryKey: ['orders'] }).catch(() => undefined);
    });
    return () => {
      unsubscribeCart();
      unsubscribeCreated();
      unsubscribeStatus();
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
        setRealtimeStatus('degraded');
        Alert.alert('Realtime', 'Canli baglanti kurulamadi, veriler elle yenilenecek.');
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
      setState((prev) => ({ ...prev, loggedIn: false }));
    });
  }, []);

  useEffect(() => {
    (async () => {
      const hasSession = await hasStoredSession();
      if (!hasSession) {
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
      Alert.alert('Login failed', 'Email veya sifre gecersiz olabilir.');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    await realtimeService.disconnect();
    queryClient.clear();
    setRealtimeStatus('offline');
    setState((prev) => ({
      ...initialState,
      themeMode: prev.themeMode,
      email: prev.email
    }));
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await addItemMutation.mutateAsync(productId);
    } catch {
      Alert.alert('Error', 'Sepete ekleme basarisiz.');
    }
  };

  const handleIncreaseQuantity = async (productId: number, currentQuantity: number) => {
    try {
      await updateItemMutation.mutateAsync({ productId, quantity: currentQuantity + 1 });
    } catch {
      Alert.alert('Error', 'Adet artirilamadi.');
    }
  };

  const handleDecreaseQuantity = async (productId: number, currentQuantity: number) => {
    try {
      await updateItemMutation.mutateAsync({ productId, quantity: Math.max(currentQuantity - 1, 0) });
    } catch {
      Alert.alert('Error', 'Adet azaltilamadi.');
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      await removeItemMutation.mutateAsync(productId);
    } catch {
      Alert.alert('Error', 'Urun sepetten kaldirilamadi.');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCartMutation.mutateAsync();
    } catch {
      Alert.alert('Error', 'Sepet temizlenemedi.');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const order = await placeOrderMutation.mutateAsync('');
      Alert.alert('Order Created', `Order #${order.id} created successfully.`);
    } catch {
      Alert.alert('Order Error', 'Siparis olusturulamadi.');
    }
  };

  const handlePreviewAr = async (productId: number) => {
    try {
      const preview = await arService.getProductPreview(productId);
      setState((prev) => ({ ...prev, arPreview: preview, isArPreviewVisible: true }));
    } catch {
      Alert.alert('Error', 'AR onizleme bilgisi alinamadi.');
    }
  };

  const handleUploadArModel = async () => {
    try {
      if (!state.selectedUploadProductId || state.selectedUploadProductId <= 0) {
        Alert.alert('Validation', 'Once bir urun secin.');
        return;
      }
      if (!state.selectedUploadFile) {
        Alert.alert('Validation', 'Once bir dosya secin.');
        return;
      }

      const result = await mediaService.uploadArModelForProduct(state.selectedUploadProductId, state.selectedUploadFile);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      const refreshedProducts = await productService.getProducts();
      const pendingProduct = refreshedProducts.filter((x) => !x.isArCompatible).sort((a, b) => a.name.localeCompare(b.name))[0];

      setState((prev) => ({
        ...prev,
        selectedUploadProductId: pendingProduct?.id ?? null,
        selectedUploadFile: null
      }));

      Alert.alert('Upload Successful', `File: ${result.uploaded.fileName}\nProduct: ${result.product?.name ?? 'N/A'}`);
    } catch {
      Alert.alert('Upload Error', 'AR model upload basarisiz.');
    }
  };

  const handlePickArFile = async () => {
    try {
      const pickedFiles = await pick({
        type: ['model/gltf+json', 'model/vnd.usdz+zip', 'application/octet-stream']
      });
      const pickedFile = pickedFiles[0];
      const validationError = validateArUploadFile({
        name: pickedFile.name,
        type: pickedFile.type,
        size: typeof pickedFile.size === 'number' ? pickedFile.size : undefined
      });
      if (validationError) {
        Alert.alert('File Validation', validationError);
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
    handlePickArFile
  };
}
