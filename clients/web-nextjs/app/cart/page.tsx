'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { computeCartDisplayTotals, formatTryCurrency, getOrderStatusLabel } from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { QuantityStepper } from '@/components/cart/QuantityStepper';
import { cartService } from '@/services/cartService';
import { orderService } from '@/services/orderService';
import { authService } from '@/services/authService';
import { realtimeService } from '@/services/realtimeService';
import { tokenStore } from '@/services/tokenStore';
import { formatCartActivityLabel, formatRelativeTimeTr } from '@/utils/activityFeed';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import type { CartDto } from '@/types/cart';
import type { OrderDto } from '@/types/order';
import type { CartChangedEvent, OrderCreatedEvent, OrderStatusChangedEvent } from '@/types/realtime';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [events, setEvents] = useState<CartChangedEvent[]>([]);
  const [orderCreatedEvents, setOrderCreatedEvents] = useState<OrderCreatedEvent[]>([]);
  const [orderStatusEvents, setOrderStatusEvents] = useState<OrderStatusChangedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<number | null>(null);
  const [busyGlobal, setBusyGlobal] = useState(false);

  const cartTotals = useMemo(() => computeCartDisplayTotals(cart), [cart]);
  const itemCount = cartTotals.itemCount;

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
        const unsubReconnect = realtimeService.onReconnected(() => {
          void refreshCart();
          void refreshOrders();
        });
        unsubscribe = () => {
          unsubCart();
          unsubOrderCreated();
          unsubOrderStatus();
          unsubReconnect();
        };
        await refreshCart();
        await refreshOrders();
      } catch (err) {
        if (isUnauthorized(err)) {
          tokenStore.clearTokens();
          router.replace('/login');
          return;
        }
        setError(getApiErrorMessage(err, 'Sepet veya anlık senkronizasyon yüklenemedi.'));
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

  const runLineAction = async (productId: number, action: () => Promise<CartDto>) => {
    setBusyProductId(productId);
    setError(null);
    try {
      const updated = await action();
      setCart(updated);
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(err, 'Sepet güncellenemedi.'));
    } finally {
      setBusyProductId(null);
    }
  };

  const handleDecrease = (productId: number, quantity: number) => {
    const nextQty = quantity - 1;
    void runLineAction(productId, () => cartService.updateItem(productId, Math.max(nextQty, 0)));
  };

  const handleIncrease = (productId: number, quantity: number) => {
    void runLineAction(productId, () => cartService.updateItem(productId, quantity + 1));
  };

  const handleRemove = (productId: number) => {
    void runLineAction(productId, () => cartService.removeItem(productId));
  };

  const handleClear = async () => {
    setBusyGlobal(true);
    setError(null);
    try {
      const updated = await cartService.clearCart();
      setCart(updated);
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(err, 'Sepet temizlenemedi.'));
    } finally {
      setBusyGlobal(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/login');
  };

  const handlePlaceOrder = async () => {
    setBusyGlobal(true);
    setError(null);
    try {
      await orderService.placeFromCart();
      await refreshCart();
      await refreshOrders();
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(err, 'Sipariş oluşturulamadı.'));
    } finally {
      setBusyGlobal(false);
    }
  };

  const isBusy = busyGlobal || busyProductId !== null;
  const hasItems = (cart?.items.length ?? 0) > 0;

  if (loading) {
    return <p className="tv-muted">Sepet yükleniyor…</p>;
  }

  return (
    <div className="tv-cart-page">
      <header className="tv-cart-page-header">
        <div>
          <span className="tv-login-pill">Mağaza</span>
          <h1 className="tv-page-title">Sepetim</h1>
          <p className="tv-page-lead">
            {hasItems
              ? `${itemCount} ürün · güncellemeler anında yansır`
              : 'Sepetiniz boş. Ürünler sayfasından ekleyebilirsiniz.'}
          </p>
        </div>
        <nav className="tv-page-actions tv-admin-breadcrumb" aria-label="Sepet gezinti">
          <Link href="/products">Ürünlere dön</Link>
          <span aria-hidden="true">·</span>
          <button type="button" className="tv-btn-secondary" onClick={() => void handleLogout()}>
            Çıkış
          </button>
        </nav>
      </header>

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="tv-card tv-cart-summary">
        <p className="tv-cart-summary-total">
          Toplam: <span>{formatTryCurrency(cartTotals.total)}</span>
        </p>
        <div className="tv-cart-toolbar">
          <button
            type="button"
            className="tv-btn-secondary"
            disabled={isBusy || !hasItems}
            onClick={() => void handleClear()}
          >
            Sepeti temizle
          </button>
          <button type="button" className="tv-submit" disabled={isBusy || !hasItems} onClick={() => void handlePlaceOrder()}>
            Sipariş oluştur
          </button>
        </div>

        {!hasItems ? (
          <p className="tv-muted" style={{ margin: 0 }}>
            Sepet boş.{' '}
            <Link href="/products">Alışverişe başla</Link>
          </p>
        ) : (
          <ul className="tv-cart-list">
            {(cart?.items ?? []).map((item) => {
              const lineBusy = busyProductId === item.productId || busyGlobal;
              return (
                <li key={item.productId} className="tv-cart-item">
                  {item.imageUrl?.trim() ? (
                    <OptimizedMediaImage
                      src={item.imageUrl}
                      alt=""
                      width={64}
                      height={64}
                      sizes="64px"
                      className="tv-cart-item-thumb"
                    />
                  ) : (
                    <div className="tv-cart-item-thumb tv-cart-item-thumb--empty" aria-hidden="true">
                      TV
                    </div>
                  )}
                  <div className="tv-cart-item-info">
                    <p className="tv-cart-item-name">{item.productName}</p>
                    <p className="tv-cart-item-meta">
                      Birim {formatTryCurrency(item.unitPrice)} · {item.quantity} adet
                    </p>
                    <p className="tv-cart-item-price">{formatTryCurrency(item.lineTotal)}</p>
                  </div>
                  <QuantityStepper
                    quantity={item.quantity}
                    busy={lineBusy}
                    onDecrease={() => handleDecrease(item.productId, item.quantity)}
                    onIncrease={() => handleIncrease(item.productId, item.quantity)}
                    onRemove={() => handleRemove(item.productId)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="tv-subsection">
        <h2 className="tv-section-title">Siparişlerim</h2>
        <ul className="tv-event-list">
          {orders.length === 0 ? (
            <li>Henüz sipariş yok.</li>
          ) : (
            orders.map((order) => (
              <li key={order.id}>
                #{order.id} · {getOrderStatusLabel(order.status)} · {formatTryCurrency(order.totalAmount)}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="tv-subsection tv-activity-section">
        <h2 className="tv-section-title">Sepet aktivite akışı</h2>
        <p className="tv-activity-lead">
          Sepetinizde yapılan değişiklikler anlık olarak burada listelenir (çoklu cihaz senkronizasyonu).
        </p>
        <ul className="tv-event-list tv-activity-list">
          {events.length === 0 ? (
            <li className="tv-activity-empty">
              Henüz kayıt yok. Başka bir oturumdan sepete ürün eklediğinizde veya adet değiştirdiğinizde
              güncellemeler burada görünür.
            </li>
          ) : (
            events.map((ev, i) => (
              <li key={`${ev.productId}-${ev.action}-${i}`} className="tv-activity-item">
                <span className="tv-activity-badge">{formatCartActivityLabel(ev.action)}</span>
                <span className="tv-activity-detail">
                  Ürün #{ev.productId} · {ev.quantity} adet
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
