'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartService } from '@/services/cartService';
import { orderService } from '@/services/orderService';
import { authService } from '@/services/authService';
import { realtimeService } from '@/services/realtimeService';
import { tokenStore } from '@/services/tokenStore';
import type { CartDto } from '@/types/cart';
import type { OrderDto } from '@/types/order';
import type { CartChangedEvent, OrderCreatedEvent, OrderStatusChangedEvent } from '@/types/realtime';

const orderStatusLabels: Record<number, string> = {
  1: 'Pending',
  2: 'Confirmed',
  3: 'Shipped',
  4: 'Delivered',
  5: 'Cancelled'
};

const getOrderStatusLabel = (status: number): string => orderStatusLabels[status] ?? `Unknown(${status})`;

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [events, setEvents] = useState<CartChangedEvent[]>([]);
  const [orderCreatedEvents, setOrderCreatedEvents] = useState<OrderCreatedEvent[]>([]);
  const [orderStatusEvents, setOrderStatusEvents] = useState<OrderStatusChangedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshCart = useCallback(async () => {
    const data = await cartService.getMyCart();
    setCart(data);
  }, []);

  const refreshOrders = useCallback(async () => {
    const data = await orderService.getMyOrders();
    setOrders(data);
  }, []);

  useEffect(() => {
    if (!tokenStore.getToken()) {
      router.replace('/login');
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await realtimeService.connect();
        const unsubCart = realtimeService.onCartChanged((ev) => {
          setEvents((prev) => [ev, ...prev].slice(0, 25));
          void refreshCart();
        });
        const unsubOrderCreated = realtimeService.onOrderCreated((ev) => {
          setOrderCreatedEvents((prev) => [ev, ...prev].slice(0, 25));
          void refreshOrders();
        });
        const unsubOrderStatus = realtimeService.onOrderStatusChanged((ev) => {
          setOrderStatusEvents((prev) => [ev, ...prev].slice(0, 25));
          void refreshOrders();
        });
        unsubscribe = () => {
          unsubCart();
          unsubOrderCreated();
          unsubOrderStatus();
        };
        await refreshCart();
        await refreshOrders();
      } catch {
        setError('Sepet veya canlı bağlantı yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    void run();

    return () => {
      unsubscribe?.();
      void realtimeService.disconnect();
    };
  }, [router, refreshCart, refreshOrders]);

  const handleUpdateQty = async (productId: number, qty: number) => {
    setBusy(true);
    try {
      const updated = await cartService.updateItem(productId, qty);
      setCart(updated);
    } catch {
      setError('Adet güncellenemedi.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (productId: number) => {
    setBusy(true);
    try {
      const updated = await cartService.removeItem(productId);
      setCart(updated);
    } catch {
      setError('Kalem kaldırılamadı.');
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setBusy(true);
    try {
      const updated = await cartService.clearCart();
      setCart(updated);
    } catch {
      setError('Sepet temizlenemedi.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/login');
  };

  const handlePlaceOrder = async () => {
    setBusy(true);
    try {
      await orderService.placeFromCart();
      await refreshCart();
      await refreshOrders();
    } catch {
      setError('Sipariş oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p>Sepet yükleniyor…</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Sepet</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/products">Ürünlere dön</Link>
          <button type="button" onClick={() => void handleLogout()} style={{ background: 'none', border: '1px solid #d4d4d8', padding: '8px 12px', borderRadius: 8 }}>
            Çıkış
          </button>
        </div>
      </div>
      {error && <p style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</p>}

      <section
        style={{
          background: '#fff',
          border: '1px solid #e4e4e7',
          borderRadius: 10,
          padding: 16,
          marginBottom: 20
        }}
      >
        <p style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>
          Toplam: {cart?.totalAmount ?? 0} TL
        </p>
        <button
          type="button"
          disabled={busy || !cart?.items.length}
          onClick={() => void handleClear()}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #166534',
            background: '#fff',
            color: '#166534',
            fontWeight: 600,
            marginBottom: 16
          }}
        >
          Sepeti temizle
        </button>
        <button
          type="button"
          disabled={busy || !cart?.items.length}
          onClick={() => void handlePlaceOrder()}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#166534',
            color: '#fff',
            fontWeight: 600,
            marginBottom: 16,
            marginLeft: 8
          }}
        >
          Sipariş oluştur
        </button>
        {(cart?.items ?? []).length === 0 ? (
          <p style={{ color: '#71717a', margin: 0 }}>Sepet boş.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(cart?.items ?? []).map((item) => (
              <li
                key={item.productId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  paddingBottom: 12,
                  borderBottom: '1px solid #f4f4f5'
                }}
              >
                <span>
                  {item.productName} × {item.quantity} = {item.lineTotal} TL
                </span>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleUpdateQty(item.productId, Math.max(item.quantity - 1, 0))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e4e4e7', background: '#fafafa' }}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleUpdateQty(item.productId, item.quantity + 1)}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #e4e4e7', background: '#fafafa' }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleRemove(item.productId)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#fecaca', color: '#991b1b', fontWeight: 600 }}
                  >
                    Kaldır
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Siparişlerim</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: 14, color: '#3f3f46' }}>
          {orders.length === 0 ? (
            <li>Henüz sipariş yok.</li>
          ) : (
            orders.map((order) => (
              <li key={order.id} style={{ marginBottom: 6 }}>
                #{order.id} · status {getOrderStatusLabel(order.status)} · total {order.totalAmount} TL
              </li>
            ))
          )}
        </ul>

        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Canlı sepet olayları (SignalR)</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, color: '#3f3f46' }}>
          {events.length === 0 ? (
            <li>Henüz olay yok. Başka cihazdan sepeti değiştirince burada görünür.</li>
          ) : (
            events.map((ev, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {ev.action} · ürün #{ev.productId} · adet {ev.quantity}
              </li>
            ))
          )}
        </ul>
        <h2 style={{ fontSize: 18, margin: '16px 0 8px' }}>Canlı order.created olayları</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, color: '#3f3f46' }}>
          {orderCreatedEvents.length === 0 ? (
            <li>Henüz order.created olayı yok.</li>
          ) : (
            orderCreatedEvents.map((ev, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                order #{ev.orderId} · status {getOrderStatusLabel(ev.status)} · total {ev.totalAmount}
              </li>
            ))
          )}
        </ul>

        <h2 style={{ fontSize: 18, margin: '16px 0 8px' }}>Canlı order.status.changed olayları</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, color: '#3f3f46' }}>
          {orderStatusEvents.length === 0 ? (
            <li>Henüz order.status.changed olayı yok.</li>
          ) : (
            orderStatusEvents.map((ev, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                order #{ev.orderId} · {getOrderStatusLabel(ev.previousStatus)} → {getOrderStatusLabel(ev.newStatus)}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
