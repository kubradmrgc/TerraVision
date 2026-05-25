import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  API_ROUTES,
  AUTH_RESPONSE_KEYS,
  DEFAULT_API_PORT,
  PRODUCT_DTO_KEYS,
  SIGNALR_EVENTS,
  SIGNALR_HUB_PATH,
  buildApiBaseUrl,
  buildSignalRHubUrl
} from '../src/apiContract.ts';

describe('apiContract', () => {
  it('builds API and SignalR URLs consistently', () => {
    assert.equal(buildApiBaseUrl('localhost'), `http://localhost:${DEFAULT_API_PORT}`);
    assert.equal(buildSignalRHubUrl('http://localhost:5090'), `http://localhost:5090${SIGNALR_HUB_PATH}`);
  });

  it('exposes stable route prefixes for web and mobile', () => {
    assert.match(API_ROUTES.products, /\/api\/products$/);
    assert.match(API_ROUTES.cartMe, /\/api\/cart\/me$/);
    assert.match(API_ROUTES.ordersFromCart, /\/api\/orders\/from-cart$/);
    assert.match(API_ROUTES.mediaArModelsPresign, /\/api\/media\/ar-models\/presign$/);
    assert.match(API_ROUTES.mediaUploadCapabilities, /\/api\/media\/upload-capabilities$/);
  });

  it('keeps SignalR event names aligned with hub', () => {
    assert.equal(SIGNALR_EVENTS.cartChanged, 'cart.changed');
    assert.equal(SIGNALR_EVENTS.cartAbandoned, 'customer.cart.abandoned');
    assert.equal(SIGNALR_EVENTS.orderCreated, 'order.created');
    assert.equal(SIGNALR_EVENTS.orderStatusChanged, 'order.status.changed');
    assert.equal(SIGNALR_EVENTS.arSessionCreated, 'ar.session.created');
    assert.equal(SIGNALR_EVENTS.exchangeOfferReceived, 'exchange.offer.received');
  });

  it('exposes TerraTakas exchange routes', () => {
    assert.match(API_ROUTES.EXCHANGE.products, /\/api\/exchange\/products$/);
    assert.match(API_ROUTES.EXCHANGE.offers, /\/api\/exchange\/offers$/);
  });

  it('exposes AR session routes', () => {
    assert.match(API_ROUTES.AR.saveSession, /\/api\/ar\/sessions$/);
    assert.match(API_ROUTES.AR.getMySessions, /\/api\/ar\/sessions\/me$/);
  });

  it('exposes presigned media routes', () => {
    assert.match(API_ROUTES.mediaArModelsPresign, /\/api\/media\/ar-models\/presign$/);
    assert.match(API_ROUTES.mediaUploadCapabilities, /\/api\/media\/upload-capabilities$/);
  });

  it('exposes plant care calendar routes', () => {
    assert.match(API_ROUTES.careMyCalendar, /\/api\/care\/my-calendar$/);
    assert.match(API_ROUTES.careCompleteAction(12), /\/api\/care\/12\/complete-action$/);
  });

  it('documents DTO key contracts for smoke tests', () => {
    assert.ok(PRODUCT_DTO_KEYS.includes('isArCompatible'));
    assert.ok(AUTH_RESPONSE_KEYS.includes('refreshToken'));
  });
});
