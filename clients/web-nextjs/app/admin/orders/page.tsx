'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { formatTryCurrency, getOrderStatusLabel, ORDER_STATUS_LABELS } from '@terravision/shared';
import { orderService } from '../../../src/services/orderService';
import { tokenStore } from '../../../src/services/tokenStore';
import { OrderDto } from '../../../src/types/order';

const statusOptions = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
  value: Number(value),
  label
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
      setError('Siparişler yüklenemedi. Admin yetkisiyle giriş yaptığından emin ol.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = tokenStore.getToken();
    if (!token) {
      router.replace('/login');
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
        `Order #${order.id} için ${getOrderStatusLabel(order.status)} -> ${getOrderStatusLabel(nextStatus)} geçişine izin yok.`
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
      setSuccess(`Order #${order.id} durumu ${getOrderStatusLabel(updated.status)} olarak güncellendi.`);
      setReasonByOrderId((prev) => ({ ...prev, [order.id]: '' }));
      await loadOrders();
    } catch (err) {
      console.error(err);
      setError(`Order #${order.id} için durum güncellenemedi.`);
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
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Admin · Sipariş Yönetimi</h1>
      <p style={{ color: '#52525b', marginBottom: 20 }}>
        Bu sayfada tüm siparişleri görebilir ve durumlarını business rule kapsamında güncelleyebilirsin.
      </p>

      <button onClick={loadOrders} disabled={loading} style={{ marginBottom: 20 }}>
        {loading ? 'Yükleniyor...' : 'Yenile'}
      </button>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={0}>Tüm Durumlar</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          placeholder="Sipariş no ara (örn: 12)"
          value={filterOrderText}
          onChange={(e) => {
            setFilterOrderText(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={filterDateRange}
          onChange={(e) => {
            setFilterDateRange(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={0}>Tüm Tarihler</option>
          <option value={1}>Bugün</option>
          <option value={7}>Son 7 Gün</option>
          <option value={30}>Son 30 Gün</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={10}>10 / sayfa</option>
          <option value={20}>20 / sayfa</option>
          <option value={50}>50 / sayfa</option>
        </select>
        <button onClick={clearFilters}>Filtreleri Temizle</button>
      </div>
      <p style={{ margin: '0 0 16px', color: '#52525b', fontSize: 14 }}>
        {orders.length} sipariş gösteriliyor (toplam: {totalCount}).
      </p>

      {error && (
        <p style={{ color: '#b91c1c', marginBottom: 16 }} role="alert">
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: '#15803d', marginBottom: 16 }} role="status">
          {success}
        </p>
      )}

      {orders.length === 0 ? (
        <p>Hiç sipariş bulunamadı.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {orders.map((order) => (
            <article key={order.id} style={{ border: '1px solid #e4e4e7', borderRadius: 10, padding: 14 }}>
              {(() => {
                const allowedStatuses = getAllowedNextStatuses(order.status);
                const selectedStatus = targetStatusByOrderId[order.id] ?? order.status;
                const canSubmit = allowedStatuses.includes(selectedStatus) && updatingOrderId !== order.id;

                return (
                  <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>
                  Order #{order.id} · User #{order.userId}
                </strong>
                <span>
                  {getOrderStatusLabel(order.status)} · {formatTryCurrency(order.totalAmount)}
                </span>
              </div>

              <p style={{ margin: '8px 0', color: '#52525b', fontSize: 13 }}>
                Oluşturulma: {new Date(order.createdDate).toLocaleString('tr-TR')}
              </p>
              {(order.updatedByUserId || order.updatedReason) && (
                <p style={{ margin: '0 0 8px', color: '#52525b', fontSize: 13 }}>
                  Son güncelleme:
                  {order.updatedByUserId ? ` admin #${order.updatedByUserId}` : ' admin bilinmiyor'}
                  {order.updatedReason ? ` · neden: ${order.updatedReason}` : ''}
                </p>
              )}

              <ul style={{ margin: '8px 0 12px', paddingLeft: 16 }}>
                {order.items.map((item, idx) => (
                  <li key={`${order.id}-${item.productId}-${idx}`} style={{ marginBottom: 4 }}>
                    {item.productName} x {item.quantity} · {item.unitPrice} TL
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
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

                <input
                  placeholder="Opsiyonel neden"
                  value={reasonByOrderId[order.id] ?? ''}
                  onChange={(e) => setReasonByOrderId((prev) => ({ ...prev, [order.id]: e.target.value }))}
                />

                <button onClick={() => handleUpdateStatus(order)} disabled={!canSubmit}>
                  {updatingOrderId === order.id ? 'Güncelleniyor...' : 'Durumu Güncelle'}
                </button>
              </div>
              <p style={{ margin: '8px 0 0', color: '#71717a', fontSize: 12 }}>
                İzinli geçişler: {allowedStatuses.map((status) => getOrderStatusLabel(status)).join(', ')}
              </p>
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1 || loading}>
          Önceki
        </button>
        {paginationTokens.map((token, idx) =>
          token === '...' ? (
            <span key={`dots-${idx}`} style={{ color: '#71717a' }}>
              ...
            </span>
          ) : (
            <button
              key={`page-${token}`}
              onClick={() => setPage(token)}
              disabled={loading || token === page}
              style={{
                fontWeight: token === page ? 700 : 400,
                border: token === page ? '1px solid #0f172a' : undefined
              }}
            >
              {token}
            </button>
          )
        )}
        <span style={{ color: '#52525b', fontSize: 14 }}>
          Sayfa {page} / {Math.max(1, totalPages)}
        </span>
        <button onClick={() => setPage((prev) => Math.min(Math.max(1, totalPages), prev + 1))} disabled={page >= totalPages || loading}>
          Sonraki
        </button>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div>Yukleniyor...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
