import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { errorCodes, isErrorWithCode, pick } from '@react-native-documents/picker';
import { Picker } from '@react-native-picker/picker';
import { authService } from './src/services/authService';
import { productService, ProductDto } from './src/services/productService';
import { realtimeService } from './src/services/realtimeService';
import { cartService } from './src/services/cartService';
import { orderService } from './src/services/orderService';
import { arService } from './src/services/arService';
import { mediaService, UploadFileInput } from './src/services/mediaService';
import { ArPreviewModal } from './src/features/ar/ArPreviewModal';
import { ArExperienceModal } from './src/features/ar/ArExperienceModal';
import { ArPreviewResponse } from './src/types/ar';
import { CartDto } from './src/types/cart';
import { OrderDto } from './src/types/order';
import { CartChangedEvent, OrderCreatedEvent, OrderStatusChangedEvent } from './src/types/realtime';

const orderStatusLabels: Record<number, string> = {
  1: 'Pending',
  2: 'Confirmed',
  3: 'Shipped',
  4: 'Delivered',
  5: 'Cancelled'
};

const getOrderStatusLabel = (status: number): string => orderStatusLabels[status] ?? `Unknown(${status})`;

function App(): React.JSX.Element {
  const [email, setEmail] = useState('admin@terravision.com');
  const [password, setPassword] = useState('admin123');
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [cart, setCart] = useState<CartDto | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [events, setEvents] = useState<CartChangedEvent[]>([]);
  const [orderCreatedEvents, setOrderCreatedEvents] = useState<OrderCreatedEvent[]>([]);
  const [orderStatusEvents, setOrderStatusEvents] = useState<OrderStatusChangedEvent[]>([]);
  const [arPreview, setArPreview] = useState<ArPreviewResponse | null>(null);
  const [isArPreviewVisible, setIsArPreviewVisible] = useState(false);
  const [isArExperienceVisible, setIsArExperienceVisible] = useState(false);
  const [selectedUploadProductId, setSelectedUploadProductId] = useState<number | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<UploadFileInput | null>(null);

  const isLoginDisabled = useMemo(() => !email || !password, [email, password]);
  const arPendingProducts = useMemo(
    () =>
      products
        .filter((x) => !x.isArCompatible)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  );
  const canUploadArModel = useMemo(
    () => isAdmin && arPendingProducts.length > 0 && selectedUploadProductId !== null && selectedUploadFile !== null,
    [isAdmin, arPendingProducts.length, selectedUploadProductId, selectedUploadFile]
  );

  const handleLogin = async () => {
    try {
      const auth = await authService.login({ email, password });
      await realtimeService.connect();
      realtimeService.onCartChanged((event) => {
        setEvents((prev) => [event, ...prev].slice(0, 25));
      });
      realtimeService.onOrderCreated((event) => {
        setOrderCreatedEvents((prev) => [event, ...prev].slice(0, 25));
      });
      realtimeService.onOrderStatusChanged((event) => {
        setOrderStatusEvents((prev) => [event, ...prev].slice(0, 25));
      });

      const productList = await productService.getProducts();
      const myCart = await cartService.getMyCart();
      const myOrders = await orderService.getMyOrders();
      setProducts(productList);
      const pendingProduct = productList
        .filter((x) => !x.isArCompatible)
        .sort((a, b) => a.name.localeCompare(b.name))[0];
      if (pendingProduct) {
        setSelectedUploadProductId(pendingProduct.id);
      } else {
        setSelectedUploadProductId(null);
      }
      setCart(myCart);
      setOrders(myOrders);
      setIsAdmin(auth.role === 3);
      setLoggedIn(true);
    } catch {
      Alert.alert('Login failed', 'Email veya sifre gecersiz olabilir.');
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      const updatedCart = await cartService.addItem(productId, 1);
      setCart(updatedCart);
    } catch {
      Alert.alert('Error', 'Sepete ekleme basarisiz.');
    }
  };

  const handleIncreaseQuantity = async (productId: number, currentQuantity: number) => {
    try {
      const updatedCart = await cartService.updateItem(productId, currentQuantity + 1);
      setCart(updatedCart);
    } catch {
      Alert.alert('Error', 'Adet artirilamadi.');
    }
  };

  const handleDecreaseQuantity = async (productId: number, currentQuantity: number) => {
    try {
      const updatedQuantity = Math.max(currentQuantity - 1, 0);
      const updatedCart = await cartService.updateItem(productId, updatedQuantity);
      setCart(updatedCart);
    } catch {
      Alert.alert('Error', 'Adet azaltilamadi.');
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      const updatedCart = await cartService.removeItem(productId);
      setCart(updatedCart);
    } catch {
      Alert.alert('Error', 'Urun sepetten kaldirilamadi.');
    }
  };

  const handleClearCart = async () => {
    try {
      const updatedCart = await cartService.clearCart();
      setCart(updatedCart);
    } catch {
      Alert.alert('Error', 'Sepet temizlenemedi.');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const order = await orderService.placeFromCart();
      const myCart = await cartService.getMyCart();
      const myOrders = await orderService.getMyOrders();
      setCart(myCart);
      setOrders(myOrders);
      Alert.alert('Order Created', `Order #${order.id} created successfully.`);
    } catch {
      Alert.alert('Order Error', 'Siparis olusturulamadi.');
    }
  };

  const handlePreviewAr = async (product: ProductDto) => {
    try {
      const preview = await arService.getProductPreview(product.id);
      setArPreview(preview);
      setIsArPreviewVisible(true);
    } catch {
      Alert.alert('Error', 'AR onizleme bilgisi alinamadi.');
    }
  };

  const handleUploadArModel = async () => {
    try {
      const productId = selectedUploadProductId;
      if (!productId || productId <= 0) {
        Alert.alert('Validation', 'Once bir urun secin.');
        return;
      }

      if (!selectedUploadFile) {
        Alert.alert('Validation', 'Once bir dosya secin.');
        return;
      }

      const result = await mediaService.uploadArModelForProduct(productId, selectedUploadFile);

      const productList = await productService.getProducts();
      setProducts(productList);
      const pendingProduct = productList
        .filter((x) => !x.isArCompatible)
        .sort((a, b) => a.name.localeCompare(b.name))[0];
      setSelectedUploadProductId(pendingProduct?.id ?? null);
      setSelectedUploadFile(null);

      Alert.alert(
        'Upload Successful',
        `File: ${result.uploaded.fileName}\nProduct: ${result.product?.name ?? 'N/A'}`
      );
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

      setSelectedUploadFile({
        uri: pickedFile.uri,
        name: pickedFile.name ?? `model-${Date.now()}`,
        type:
          pickedFile.type ??
          (pickedFile.name?.toLowerCase().endsWith('.usdz')
            ? 'model/vnd.usdz+zip'
            : 'model/gltf+json')
      });
    } catch (error) {
      if (!isErrorWithCode(error) || error.code !== errorCodes.OPERATION_CANCELED) {
        Alert.alert('File Error', 'Dosya secilemedi.');
      }
    }
  };

  if (!loggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>TerraVision Mobile</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={[styles.button, isLoginDisabled && styles.buttonDisabled]}
          disabled={isLoginDisabled}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Products</Text>
        <FlatList
          data={products}
          scrollEnabled={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text>{item.price} TL</Text>
              <TouchableOpacity style={styles.button} onPress={() => handleAddToCart(item.id)}>
                <Text style={styles.buttonText}>Add To Cart</Text>
              </TouchableOpacity>
              {item.isArCompatible && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => handlePreviewAr(item)}
                >
                  <Text style={styles.secondaryButtonText}>View In AR</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />

        {isAdmin && (
          <>
            <Text style={styles.title}>Admin AR Model Upload</Text>
            <View style={styles.card}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedUploadProductId}
                  onValueChange={(value) => setSelectedUploadProductId(value)}
                >
                  {arPendingProducts.map((product) => (
                    <Picker.Item
                      key={product.id}
                      label={`${product.name} (#${product.id}) - AR pending`}
                      value={product.id}
                    />
                  ))}
                </Picker>
              </View>
              {arPendingProducts.length === 0 && (
                <Text style={styles.eventText}>
                  AR modeli bekleyen urun yok. Tum urunler baglanmis gorunuyor.
                </Text>
              )}
              <TouchableOpacity
                style={[styles.secondaryButton, arPendingProducts.length === 0 && styles.buttonDisabled]}
                disabled={arPendingProducts.length === 0}
                onPress={handlePickArFile}
              >
                <Text style={styles.secondaryButtonText}>Pick AR Model File</Text>
              </TouchableOpacity>
              <Text style={styles.eventText}>
                {selectedUploadFile
                  ? `Selected: ${selectedUploadFile.name}`
                  : 'No file selected'}
              </Text>
              <TouchableOpacity
                style={[styles.button, !canUploadArModel && styles.buttonDisabled]}
                disabled={!canUploadArModel}
                onPress={handleUploadArModel}
              >
                <Text style={styles.buttonText}>Upload And Bind Model</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={styles.title}>My Cart</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total: {cart?.totalAmount ?? 0} TL</Text>
          <TouchableOpacity style={styles.button} onPress={handlePlaceOrder}>
            <Text style={styles.buttonText}>Place Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleClearCart}>
            <Text style={styles.secondaryButtonText}>Clear Cart</Text>
          </TouchableOpacity>
          {(cart?.items ?? []).map((item) => (
            <View key={item.productId} style={styles.cartItemRow}>
              <Text style={styles.eventText}>
                {item.productName} x{item.quantity} = {item.lineTotal} TL
              </Text>
              <View style={styles.cartActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDecreaseQuantity(item.productId, item.quantity)}
                >
                  <Text style={styles.actionButtonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleIncreaseQuantity(item.productId, item.quantity)}
                >
                  <Text style={styles.actionButtonText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item.productId)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.title}>My Orders</Text>
        <View style={styles.card}>
          {(orders ?? []).length === 0 ? (
            <Text style={styles.eventText}>No orders yet.</Text>
          ) : (
            orders.map((order) => (
              <Text key={order.id} style={styles.eventText}>
                #{order.id} status:{getOrderStatusLabel(order.status)} total:{order.totalAmount} TL
              </Text>
            ))
          )}
        </View>

        <Text style={styles.title}>Realtime Events</Text>
        <FlatList
          data={events}
          scrollEnabled={false}
          keyExtractor={(_, idx) => String(idx)}
          renderItem={({ item }) => (
            <Text style={styles.eventText}>
              {item.action} product:{item.productId} qty:{item.quantity}
            </Text>
          )}
        />
        <Text style={styles.title}>Order Created Events</Text>
        <FlatList
          data={orderCreatedEvents}
          scrollEnabled={false}
          keyExtractor={(_, idx) => `oc-${idx}`}
          renderItem={({ item }) => (
            <Text style={styles.eventText}>
              order #{item.orderId} status:{getOrderStatusLabel(item.status)} total:{item.totalAmount}
            </Text>
          )}
        />

        <Text style={styles.title}>Order Status Events</Text>
        <FlatList
          data={orderStatusEvents}
          scrollEnabled={false}
          keyExtractor={(_, idx) => `os-${idx}`}
          renderItem={({ item }) => (
            <Text style={styles.eventText}>
              order #{item.orderId} {getOrderStatusLabel(item.previousStatus)}→{getOrderStatusLabel(item.newStatus)}
            </Text>
          )}
        />
      </ScrollView>
      <ArPreviewModal
        visible={isArPreviewVisible}
        preview={arPreview}
        onStartAr={() => {
          setIsArPreviewVisible(false);
          setIsArExperienceVisible(true);
        }}
        onClose={() => setIsArPreviewVisible(false)}
      />
      <ArExperienceModal
        visible={isArExperienceVisible}
        preview={arPreview}
        onClose={() => setIsArExperienceVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7f7f7' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: 'white'
  },
  button: {
    backgroundColor: '#2f7d32',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8
  },
  buttonDisabled: {
    backgroundColor: '#9fb89f'
  },
  buttonText: { color: 'white', fontWeight: '600', textAlign: 'center' },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10
  },
  cardTitle: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  eventText: {
    fontSize: 13,
    marginBottom: 6,
    color: '#1f2937'
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2f7d32',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 10
  },
  secondaryButtonText: {
    color: '#2f7d32',
    fontWeight: '600',
    textAlign: 'center'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden'
  },
  cartItemRow: {
    marginBottom: 8
  },
  cartActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  actionButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    minWidth: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  actionButtonText: {
    fontWeight: '700',
    color: '#111827'
  },
  removeButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    paddingHorizontal: 10,
    justifyContent: 'center'
  },
  removeButtonText: {
    color: '#991b1b',
    fontWeight: '600'
  }
});

export default App;
