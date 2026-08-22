'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { formatTryCurrency, ORDER_STATUS_LABELS } from '@terravision/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { AdminOrderStatusBadge, orderStatusLabelTr } from '@/components/admin/AdminStatusBadge';
import { orderService } from '@/services/orderService';
import { tokenStore } from '@/services/tokenStore';
import { OrderDto } from '@/types/order';

const statusOptions = Object.entries(ORDER_STATUS_LABELS).map(([value]) => ({
  value: Number(value),
  label: orderStatusLabelTr(Number(value))
}));

const getAllowedNextStatuses = (currentStatus: number): number[] => {
  switch (currentStatus) {
    case 1:
      return [1, 2, 5];
    case 2:
      return [2, 3, 5];
    case 3:
      return [3, 4];
    case 4:
      return [4];
    case 5:
      return [5];
    default:
      return [currentStatus];
  }
};

function AdminOrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reasonByOrderId, setReasonByOrderId] = useState<Record<number, string>>({});
  const [targetStatusByOrderId, setTargetStatusByOrderId] = useState<Record<number, number>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState<number>(() => {
    const raw = searchParams.get('page');
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 1;
  });
  const [pageSize, setPageSize] = useState<number>(() => {
    const raw = searchParams.get('pageSize');
    const value = Number(raw);
    return value === 10 || value === 20 || value === 50 ? value : 20;
  });
  const [filterStatus, setFilterStatus] = useState<number>(() => {
    const raw = searchParams.get('status');
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  });
  const [filterOrderText, setFilterOrderText] = useState(() => searchParams.get('order') ?? '');
  const [filterDateRange, setFilterDateRange] = useState<number>(() => {
    const raw = searchParams.get('range');
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  });

  const paginationTokens = useMemo(() => {
    const safeTotalPages = Math.max(1, totalPages);
    const pages = new Set<number>([1, safeTotalPages, page - 1, page, page + 1]);
    const filtered = Array.from(pages)
      .filter((p) => p >= 1 && p <= safeTotalPages)
      .sort((a, b) => a - b);

    const tokens: Array<number | '...'> = [];
    for (let i = 0; i < filtered.length; i++) {
      const current = filtered[i];
      const prev = filtered[i - 1];
      if (i > 0 && prev !== undefined && current - prev > 1) {
        tokens.push('...');
      }
      tokens.push(current);
    }

    return tokens;
  }, [page, totalPages]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const trimmedOrderText = filterOrderText.trim();
      const parsedOrderId = Number(trimmedOrderText);
      const data = await orderService.getAllOrders({
        page,
        pageSize,
        status: filterStatus > 0 ? filterStatus : undefined,
        orderId: trimmedOrderText && Number.isInteger(parsedOrderId) ? parsedOrderId : undefined,
        rangeDays: filterDateRange > 0 ? filterDateRange : undefined
      });
      setOrders(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError('Siparişler yüklenemedi. Yönetici hesabıyla giriş yaptığınızdan emin olun.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = tokenStore.getToken();
    if (!token) {
      router.replace('/login/admin');
      return;
    }

    loadOrders();
  }, [router, page, pageSize, filterStatus, filterOrderText, filterDateRange]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (page > 1) {
      params.set('page', String(page));
    }

    if (pageSize !== 20) {
      params.set('pageSize', String(pageSize));
    }

    if (filterStatus > 0) {
      params.set('status', String(filterStatus));
    } else {
      params.delete('status');
    }

    const trimmedOrder = filterOrderText.trim();
    if (trimmedOrder.length > 0) {
      params.set('order', trimmedOrder);
    } else {
      params.delete('order');
    }

    if (filterDateRange > 0) {
      params.set('range', String(filterDateRange));
    } else {
      params.delete('range');
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }
  }, [page, pageSize, filterStatus, filterOrderText, filterDateRange, pathname, router, searchParams]);

  useEffect(() => {
    const safeTotalPages = Math.max(1, totalPages);
    if (page > safeTotalPages) {
      setPage(safeTotalPages);
    }
  }, [page, totalPages]);

  const handleUpdateStatus = async (order: OrderDto) => {
    const nextStatus = targetStatusByOrderId[order.id] ?? order.status;
    const allowedStatuses = getAllowedNextStatuses(order.status);
    const reason = reasonByOrderId[order.id]?.trim() || undefined;

    if (!allowedStatuses.includes(nextStatus)) {
      setError(
        `#${order.id} siparişi için ${orderStatusLabelTr(order.status)} → ${orderStatusLabelTr(nextStatus)} geçişine izin yok.`
      );
      setSuccess(null);
      return;
    }

    setUpdatingOrderId(order.id);
    setError(null);
    setSuccess(null);
    try {
      const updated = await orderService.updateOrderStatus(order.id, {
        status: nextStatus,
        reason
      });

      setOrders((prev: OrderDto[]) => prev.map((x: OrderDto) => (x.id === updated.id ? updated : x)));
      setSuccess(`#${order.id} siparişi “${orderStatusLabelTr(updated.status)}” olarak güncellendi.`);
      setReasonByOrderId((prev) => ({ ...prev, [order.id]: '' }));
      await loadOrders();
    } catch (err) {
      console.error(err);
      setError(`#${order.id} siparişi için durum güncellenemedi.`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const clearFilters = () => {
    setFilterStatus(0);
    setFilterOrderText('');
    setFilterDateRange(0);
    setPage(1);
  };

  return (
    <AdminPageShell
      title="Sipariş yönetimi"
      lead="Tüm siparişleri filtreleyin, onaylayın ve kargo/teslim durumunu güncelleyin."
      actions={
        <button type="button" className="tv-btn tv-btn--primary" onClick={() => void loadOrders()} disabled={loading}>
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </button>
      }
    >
      <form
        className="tv-card tv-admin-filters"
        onSubmit={(e) => {
          e.preventDefault();
          void loadOrders();
        }}
      >
        <div className="tv-admin-filters-row">
          <label>
            Durum
            <select
              className="tv-input"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={0}>Tüm durumlar</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sipariş no
            <input
              className="tv-input"
              placeholder="örn. 12"
              value={filterOrderText}
              onChange={(e) => {
                setFilterOrderText(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            Tarih
            <select
              className="tv-input"
              value={filterDateRange}
              onChange={(e) => {
                setFilterDateRange(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={0}>Tüm tarihler</option>
              <option value={1}>Bugün</option>
              <option value={7}>Son 7 gün</option>
              <option value={30}>Son 30 gün</option>
            </select>
          </label>
          <label>
            Sayfa boyutu
            <select
              className="tv-input"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
        <div className="tv-admin-filters-actions">
          <button type="submit" className="tv-btn tv-btn--primary" disabled={loading}>
            Uygula
          </button>
          <button type="button" className="tv-btn" onClick={clearFilters}>
            Temizle
          </button>
        </div>
      </form>

      <p className="tv-admin-result-meta">
        {orders.length} kayıt gösteriliyor · toplam <strong>{totalCount}</strong>
      </p>

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="tv-success" role="status">
          {success}
        </p>
      ) : null}

      {orders.length === 0 && !loading ? (
        <div className="tv-card tv-admin-empty">
          <p className="tv-muted">Kriterlere uygun sipariş bulunamadı.</p>
        </div>
      ) : (
        <ul className="tv-admin-order-list">
          {orders.map((order) => {
            const allowedStatuses = getAllowedNextStatuses(order.status);
            const selectedStatus = targetStatusByOrderId[order.id] ?? order.status;
            const canSubmit = allowedStatuses.includes(selectedStatus) && updatingOrderId !== order.id;

            return (
              <li key={order.id} className="tv-card tv-admin-order-card">
                <div className="tv-admin-order-card-head">
                  <div>
                    <span className="tv-admin-order-id">Sipariş #{order.id}</span>
                    <span className="tv-muted"> · Müşteri #{order.userId}</span>
                  </div>
                  <div className="tv-admin-order-card-meta">
                    <AdminOrderStatusBadge status={order.status} />
                    <strong className="tv-admin-order-total">{formatTryCurrency(order.totalAmount)}</strong>
                  </div>
                </div>

                <p className="tv-muted tv-admin-order-date">
                  Oluşturulma: {new Date(order.createdDate).toLocaleString('tr-TR')}
                </p>
                {order.updatedByUserId || order.updatedReason ? (
                  <p className="tv-muted tv-admin-order-date">
                    Son güncelleme
                    {order.updatedByUserId ? ` · yönetici #${order.updatedByUserId}` : ''}
                    {order.updatedReason ? ` · ${order.updatedReason}` : ''}
                  </p>
                ) : null}

                <ul className="tv-admin-order-items">
                  {order.items.map((item, idx) => (
                    <li key={`${order.id}-${item.productId}-${idx}`}>
                      {item.productName} × {item.quantity}
                      <span className="tv-muted"> · {formatTryCurrency(item.unitPrice)}</span>
                    </li>
                  ))}
                </ul>

                <div className="tv-admin-order-actions">
                  <label className="tv-admin-field">
                    <span>Yeni durum</span>
                    <select
                      className="tv-input"
                      value={selectedStatus}
                      onChange={(e) =>
                        setTargetStatusByOrderId((prev) => ({ ...prev, [order.id]: Number(e.target.value) }))
                      }
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} disabled={!allowedStatuses.includes(opt.value)}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="tv-admin-field tv-admin-field--grow">
                    <span>Not (iptal için zorunlu)</span>
                    <input
                      className="tv-input"
                      placeholder="Opsiyonel açıklama"
                      value={reasonByOrderId[order.id] ?? ''}
                      onChange={(e) => setReasonByOrderId((prev) => ({ ...prev, [order.id]: e.target.value }))}
                    />
                  </label>
                  <button
                    type="button"
                    className="tv-btn tv-btn--primary"
                    disabled={!canSubmit}
                    onClick={() => void handleUpdateStatus(order)}
                  >
                    {updatingOrderId === order.id ? 'Kaydediliyor…' : 'Güncelle'}
                  </button>
                </div>
                <p className="tv-admin-order-hint">
                  İzinli: {allowedStatuses.map((s) => orderStatusLabelTr(s)).join(' → ')}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <nav className="tv-admin-pagination" aria-label="Sipariş sayfalama">
        <button
          type="button"
          className="tv-btn"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1 || loading}
        >
          Önceki
        </button>
        {paginationTokens.map((token, idx) =>
          token === '...' ? (
            <span key={`dots-${idx}`} className="tv-muted">
              …
            </span>
          ) : (
            <button
              key={`page-${token}`}
              type="button"
              className={`tv-btn${token === page ? ' tv-btn--primary' : ''}`}
              onClick={() => setPage(token)}
              disabled={loading || token === page}
            >
              {token}
            </button>
          )
        )}
        <span className="tv-muted">
          Sayfa {page} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          className="tv-btn"
          onClick={() => setPage((prev) => Math.min(Math.max(1, totalPages), prev + 1))}
          disabled={page >= totalPages || loading}
        >
          Sonraki
        </button>
      </nav>
    </AdminPageShell>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <AdminPageShell title="Sipariş yönetimi" lead="Yükleniyor…">
          <p className="tv-muted">Sipariş listesi hazırlanıyor…</p>
        </AdminPageShell>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  );
}
