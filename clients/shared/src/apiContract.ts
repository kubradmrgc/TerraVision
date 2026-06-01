/** Default HTTP port from TerraVision.Api launch profile (`http`). */
export const DEFAULT_API_PORT = 5090;

export const API_PATH_PREFIX = '/api';

export const SIGNALR_HUB_PATH = '/hubs/terravision';

/** SignalR event names — must match `TerraVisionHub` on the server. */
export const SIGNALR_EVENTS = {
  cartChanged: 'cart.changed',
  cartAbandoned: 'customer.cart.abandoned',
  orderCreated: 'order.created',
  orderStatusChanged: 'order.status.changed',
  arSessionCreated: 'ar.session.created',
  productLowStock: 'product.low.stock',
  exchangeOfferReceived: 'exchange.offer.received',
  exchangeOfferStatusChanged: 'exchange.offer.status.changed',
  exchangeProductListed: 'exchange.product.listed'
} as const;

export const EXCHANGE_ROUTES = {
  products: `${API_PATH_PREFIX}/exchange/products`,
  productById: (id: number) => `${API_PATH_PREFIX}/exchange/products/${id}`,
  myProducts: `${API_PATH_PREFIX}/exchange/products/mine`,
  offers: `${API_PATH_PREFIX}/exchange/offers`,
  offersReceived: `${API_PATH_PREFIX}/exchange/offers/received`,
  offersSent: `${API_PATH_PREFIX}/exchange/offers/sent`,
  offerStatus: (id: number) => `${API_PATH_PREFIX}/exchange/offers/${id}/status`,
  mediaExchangeImages: `${API_PATH_PREFIX}/media/exchange-images`
} as const;

export const API_ROUTES_AR = {
  saveSession: `${API_PATH_PREFIX}/ar/sessions`,
  getMySessions: `${API_PATH_PREFIX}/ar/sessions/me`,
  getAllSessions: `${API_PATH_PREFIX}/ar/sessions`
} as const;

export const API_ROUTES = {
  authLogin: `${API_PATH_PREFIX}/auth/login`,
  authRegister: `${API_PATH_PREFIX}/auth/register`,
  authRefresh: `${API_PATH_PREFIX}/auth/refresh`,
  authLogout: `${API_PATH_PREFIX}/auth/logout`,
  categories: `${API_PATH_PREFIX}/categories`,
  products: `${API_PATH_PREFIX}/products`,
  productsWithImage: `${API_PATH_PREFIX}/products/with-image`,
  cartMe: `${API_PATH_PREFIX}/cart/me`,
  cartItems: `${API_PATH_PREFIX}/cart/items`,
  cartItemByProduct: (productId: number) => `${API_PATH_PREFIX}/cart/items/${productId}`,
  ordersFromCart: `${API_PATH_PREFIX}/orders/from-cart`,
  ordersMe: `${API_PATH_PREFIX}/orders/me`,
  ordersAdmin: `${API_PATH_PREFIX}/orders`,
  orderStatus: (orderId: number) => `${API_PATH_PREFIX}/orders/${orderId}/status`,
  appointments: `${API_PATH_PREFIX}/appointments`,
  appointmentsCustomer: `${API_PATH_PREFIX}/appointments/customer`,
  appointmentsConsultant: `${API_PATH_PREFIX}/appointments/consultant`,
  appointmentStatus: (id: number) => `${API_PATH_PREFIX}/appointments/${id}/status`,
  appointmentOutcome: (id: number) => `${API_PATH_PREFIX}/appointments/${id}/outcome`,
  appointmentsPerformanceBoard: `${API_PATH_PREFIX}/appointments/analytics/performance`,
  appointmentsMyPerformance: `${API_PATH_PREFIX}/appointments/analytics/my-performance`,
  careMyCalendar: `${API_PATH_PREFIX}/care/my-calendar`,
  careCompleteAction: (calendarId: number) =>
    `${API_PATH_PREFIX}/care/${calendarId}/complete-action`,
  arPreview: (productId: number) => `${API_PATH_PREFIX}/ar/products/${productId}/preview`,
  mediaArModels: `${API_PATH_PREFIX}/media/ar-models`,
  mediaArModelsPresign: `${API_PATH_PREFIX}/media/ar-models/presign`,
  mediaArModelsConfirm: `${API_PATH_PREFIX}/media/ar-models/confirm`,
  mediaArScreenshotsPresign: `${API_PATH_PREFIX}/media/ar-screenshots/presign`,
  mediaProductImages: `${API_PATH_PREFIX}/media/product-images`,
  mediaProductImagesPresign: `${API_PATH_PREFIX}/media/product-images/presign`,
  mediaProductImagesConfirm: `${API_PATH_PREFIX}/media/product-images/confirm`,
  mediaUploadCapabilities: `${API_PATH_PREFIX}/media/upload-capabilities`,
  mediaExchangeImages: `${API_PATH_PREFIX}/media/exchange-images`,
  health: '/health',
  AR: API_ROUTES_AR,
  EXCHANGE: EXCHANGE_ROUTES
} as const;

export function buildApiBaseUrl(host: string, port: number = DEFAULT_API_PORT): string {
  const trimmed = host.trim().replace(/\/$/, '');
  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    if (url.port) {
      return url.origin;
    }
    return `${url.protocol}//${url.hostname}:${port}`;
  }
  return `http://${trimmed}:${port}`;
}

export function buildSignalRHubUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}${SIGNALR_HUB_PATH}`;
}

/** Product JSON keys both clients must handle (contract smoke tests). */
export const PRODUCT_DTO_KEYS = [
  'id',
  'name',
  'description',
  'price',
  'stockQuantity',
  'minStockLevel',
  'sku',
  'imageUrl',
  'isArCompatible',
  'categoryId'
] as const;

/** Auth JSON keys returned by POST /api/auth/login. */
export const AUTH_RESPONSE_KEYS = [
  'token',
  'refreshToken',
  'accessTokenExpiresAtUtc',
  'refreshTokenExpiresAtUtc',
  'userId',
  'firstName',
  'lastName',
  'email',
  'role'
] as const;
