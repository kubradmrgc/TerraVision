import {
  API_ROUTES,
  SIGNALR_EVENTS,
  buildApiBaseUrl,
  buildSignalRHubUrl,
  getOrderStatusLabel
} from '@terravision/shared';
describe('shared contract (mobile)', () => {
  it('matches web SignalR event names', () => {
    expect(SIGNALR_EVENTS.cartChanged).toBe('cart.changed');
    expect(SIGNALR_EVENTS.orderCreated).toBe('order.created');
    expect(SIGNALR_EVENTS.orderStatusChanged).toBe('order.status.changed');
  });

  it('builds hub URL from API base', () => {
    const base = buildApiBaseUrl('localhost');
    expect(buildSignalRHubUrl(base)).toBe('http://localhost:5090/hubs/terravision');
  });

  it('exposes auth register route used by both clients', () => {
    expect(API_ROUTES.authRegister).toBe('/api/auth/register');
  });

  it('exposes commerce routes used by both clients', () => {
    expect(API_ROUTES.cartMe).toBe('/api/cart/me');
    expect(API_ROUTES.ordersFromCart).toBe('/api/orders/from-cart');
  });

  it('resolves order status labels consistently', () => {
    expect(getOrderStatusLabel(1)).toBe('Pending');
    expect(getOrderStatusLabel(99)).toBe('Unknown(99)');
  });
});
