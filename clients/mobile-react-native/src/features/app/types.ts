import { LoginPortal } from '@terravision/shared';
import { UploadFileInput } from '../../services/mediaService';
import { ProductDto } from '../../services/productService';
import { AppointmentDto } from '../../types/appointment';
import { ArPreviewResponse } from '../../types/ar';
import { CartDto } from '../../types/cart';
import { OrderDto } from '../../types/order';
import { CartChangedEvent, OrderCreatedEvent, OrderStatusChangedEvent } from '../../types/realtime';

export type ThemeMode = 'light' | 'dark';
export type MobileSection = 'products' | 'cart' | 'orders' | 'appointments' | 'care' | 'exchange' | 'events';

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
  /** M3-style tokens (Stitch / product dashboard light) */
  brandTitle: string;
  outlineVariant: string;
  surfaceDim: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  bottomNav: string;
  navInactive: string;
  imagePlaceholder: string;
  /** Product dashboard (Stitch dark / bento) */
  elevatedSurface: string;
  surfaceLowest: string;
  stockPillBg: string;
  stockPillBorder: string;
  stockPillText: string;
  stockLowPillBg: string;
  stockLowPillBorder: string;
  stockLowPillText: string;
  arPillBg: string;
  arPillBorder: string;
  arPillText: string;
  productCtaBg: string;
  productCtaFg: string;
  productCtaBorder: string;
  /** Dark: outline “Add to cart”; light: solid primary */
  productUseOutlineAddToCart: boolean;
  realtimeCapsuleBg: string;
  realtimeCapsuleBorder: string;
  realtimeCapsuleLabelColor: string;
  realtimeCapsuleDotColor: string;
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
  loginPortal: LoginPortal | null;
};
