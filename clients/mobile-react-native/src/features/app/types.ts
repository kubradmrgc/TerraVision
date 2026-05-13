import { UploadFileInput } from '../../services/mediaService';
import { ProductDto } from '../../services/productService';
import { AppointmentDto } from '../../types/appointment';
import { ArPreviewResponse } from '../../types/ar';
import { CartDto } from '../../types/cart';
import { OrderDto } from '../../types/order';
import { CartChangedEvent, OrderCreatedEvent, OrderStatusChangedEvent } from '../../types/realtime';

export type ThemeMode = 'light' | 'dark';
export type MobileSection = 'products' | 'cart' | 'orders' | 'appointments' | 'events';

export type MobilePalette = {
  bg: string;
  card: string;
  text: string;
  subText: string;
  border: string;
  button: string;
  buttonText: string;
  header: string;
  mutedCard: string;
};

export type MobileAppState = {
  email: string;
  password: string;
  loggedIn: boolean;
  isAdmin: boolean;
  role: number | null;
  products: ProductDto[];
  cart: CartDto | null;
  orders: OrderDto[];
  appointments: AppointmentDto[];
  events: CartChangedEvent[];
  orderCreatedEvents: OrderCreatedEvent[];
  orderStatusEvents: OrderStatusChangedEvent[];
  arPreview: ArPreviewResponse | null;
  isArPreviewVisible: boolean;
  isArExperienceVisible: boolean;
  selectedUploadProductId: number | null;
  selectedUploadFile: UploadFileInput | null;
  themeMode: ThemeMode;
  activeSection: MobileSection;
};
