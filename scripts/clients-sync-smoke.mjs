#!/usr/bin/env node
/**
 * Live API smoke test — same contract web + mobile use.
 * Requires API running: dotnet run (http://localhost:5090)
 *
 * Usage:
 *   node scripts/clients-sync-smoke.mjs
 *   TERRAVISION_API_URL=http://192.168.1.10:5090 node scripts/clients-sync-smoke.mjs
 */
import assert from 'node:assert/strict';

const API_BASE = (process.env.TERRAVISION_API_URL ?? 'http://localhost:5090').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.TERRAVISION_ADMIN_EMAIL ?? 'admin@terravision.com';
const ADMIN_PASSWORD = process.env.TERRAVISION_ADMIN_PASSWORD ?? 'admin123';

const PRODUCT_KEYS = [
  'id',
  'name',
  'description',
  'price',
  'stockQuantity',
  'sku',
  'imageUrl',
  'isArCompatible',
  'categoryId'
];

const AUTH_KEYS = [
  'token',
  'refreshToken',
  'accessTokenExpiresAtUtc',
  'refreshTokenExpiresAtUtc',
  'userId',
  'firstName',
  'lastName',
  'email',
  'role'
];

const CART_KEYS = ['cartId', 'userId', 'totalAmount', 'items'];

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { res, body };
}

function assertKeys(obj, keys, label) {
  for (const key of keys) {
    assert.ok(key in obj, `${label} missing key: ${key}`);
  }
}

async function main() {
  console.log(`TerraVision client sync smoke → ${API_BASE}`);

  const health = await request('/health');
  assert.equal(health.res.status, 200, 'GET /health should return 200');

  const products = await request('/api/products');
  assert.equal(products.res.status, 200, 'GET /api/products should return 200');
  assert.ok(Array.isArray(products.body), 'products payload should be an array');
  if (products.body.length > 0) {
    assertKeys(products.body[0], PRODUCT_KEYS, 'ProductDto');
  }

  const badLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nobody@example.com', password: 'wrong' })
  });
  assert.equal(badLogin.res.status, 401, 'invalid login should be 401');

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  assert.equal(login.res.status, 200, 'admin login should succeed');
  assertKeys(login.body, AUTH_KEYS, 'AuthResponse');
  const token = login.body.token;
  assert.ok(typeof token === 'string' && token.length > 10, 'JWT token expected');

  const authHeader = { Authorization: `Bearer ${token}` };

  const cart = await request('/api/cart/me', { headers: authHeader });
  assert.equal(cart.res.status, 200, 'GET /api/cart/me should return 200');
  assertKeys(cart.body, CART_KEYS, 'CartDto');
  assert.ok(Array.isArray(cart.body.items), 'cart.items should be an array');

  const orders = await request('/api/orders/me', { headers: authHeader });
  assert.equal(orders.res.status, 200, 'GET /api/orders/me should return 200');
  assert.ok(Array.isArray(orders.body), 'orders/me should be an array');
  if (orders.body.length > 0 && orders.body[0].items?.length > 0) {
    const line = orders.body[0].items[0];
    assert.ok('productId' in line && 'lineTotal' in line, 'OrderItemDto shape');
  }

  const refresh = await request('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: login.body.refreshToken })
  });
  assert.equal(refresh.res.status, 200, 'POST /api/auth/refresh should return 200');
  assert.ok(refresh.body?.token, 'refresh should return a new access token');

  if (products.body.length > 0) {
    const productId = products.body[0].id;
    const add = await request('/api/cart/items', {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    assert.equal(add.res.status, 200, 'POST /api/cart/items should return 200');
    assert.ok(Array.isArray(add.body?.items), 'cart after add should include items array');
    const hasLine = add.body.items.some((line) => line.productId === productId);
    assert.ok(hasLine, 'cart should contain the added product line');
  }

  const hubProbe = await request('/hubs/terravision/negotiate', {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: '{}'
  });
  assert.ok(
    hubProbe.res.status === 200 || hubProbe.res.status === 401 || hubProbe.res.status === 405,
    `SignalR negotiate probe unexpected status: ${hubProbe.res.status}`
  );

  console.log('OK — web/mobile shared API contract verified against live API.');
}

main().catch((err) => {
  console.error('FAIL —', err.message ?? err);
  if (err.cause) console.error(err.cause);
  process.exit(1);
});
