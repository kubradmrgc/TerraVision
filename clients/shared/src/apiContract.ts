/** Default HTTP port from TerraVision.Api launch profile (`http`). */
export const DEFAULT_API_PORT = 5090;

export const API_PATH_PREFIX = '/api';

export const SIGNALR_HUB_PATH = '/hubs/terravision';

/** SignalR event names — must match `TerraVisionHub` on the server. */
export const SIGNALR_EVENTS = {
  cartChanged: 'cart.changed',
  orderCreated: 'order.created',
  orderStatusChanged: 'order.status.changed'
} as const;

export const API_ROUTES = {
  authLogin: `${API_PATH_PREFIX}/auth/login`,
  authRefresh: `${API_PATH_PREFIX}/auth/refresh`,
  authLogout: `${API_PATH_PREFIX}/auth/logout`,
  products: `${API_PATH_PREFIX}/products`,
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
  arPreview: (productId: number) => `${API_PATH_PREFIX}/ar/products/${productId}/preview`,
  mediaArModels: `${API_PATH_PREFIX}/media/ar-models`,
  health: '/health'
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
