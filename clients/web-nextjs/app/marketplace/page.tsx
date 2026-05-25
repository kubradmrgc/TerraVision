'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  EXCHANGE_CONDITION,
  EXCHANGE_CONDITION_LABELS,
  ExchangeCondition,
  ExchangeProductDto,
  formatTryCurrency
} from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { exchangeService } from '@/services/exchangeService';
import { realtimeService } from '@/services/realtimeService';
import { tokenStore } from '@/services/tokenStore';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';

type FilterMode = 'all' | 'swap' | 'sale';

export default function MarketplacePage() {
  const router = useRouter();
  const [products, setProducts] = useState<ExchangeProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [condition, setCondition] = useState<ExchangeCondition | ''>('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const swapOnly = filterMode === 'swap' ? true : filterMode === 'sale' ? false : undefined;
      const list = await exchangeService.listProducts({
        condition: condition === '' ? undefined : condition,
        swapOnly
      });
      setProducts(list);
    } catch (err) {
      setError(getApiErrorMessage(err, 'TerraTakas ilanları yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, [condition, filterMode]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!tokenStore.getToken()) {
      return;
    }
    void realtimeService.connect();
    const unsubListed = realtimeService.onExchangeProductListed((event) => {
      setProducts((prev) => {
        if (prev.some((p) => p.id === event.product.id)) {
          return prev;
        }
        return [event.product, ...prev];
      });
    });
    const unsubReconnect = realtimeService.onReconnected(() => {
      void load();
    });
    return () => {
      unsubListed();
      unsubReconnect();
    };
  }, [load]);

  const filteredLabel = useMemo(() => {
    if (filterMode === 'swap') return 'Yalnızca takas';
    if (filterMode === 'sale') return 'Satılık';
    return 'Tüm ilanlar';
  }, [filterMode]);

  if (loading) {
    return <p className="tv-muted">TerraTakas yükleniyor…</p>;
  }

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <span className="tv-login-pill">TerraTakas</span>
        <h1 className="tv-page-title">Topluluk pazarı</h1>
        <p className="tv-page-lead">Bitki ve saksı ilanlarını keşfedin, takas veya satın alma teklifi verin.</p>
        <p className="tv-page-actions">
          {tokenStore.getToken() ? (
            <>
              <Link href="/profile/exchange">İlanlarım ve teklifler →</Link>
              {' · '}
            </>
          ) : (
            <>
              <Link href="/login">Giriş yapın</Link>
              {' · '}
            </>
          )}
          <Link href="/products">Mağazaya dön</Link>
        </p>
      </header>

      <div className="tv-card" style={{ marginBottom: 16, padding: 16 }}>
        <p className="tv-muted" style={{ marginBottom: 8 }}>
          Filtre: {filteredLabel}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(['all', 'swap', 'sale'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`tv-btn${filterMode === mode ? ' tv-btn--primary' : ''}`}
              onClick={() => setFilterMode(mode)}
            >
              {mode === 'all' ? 'Tümü' : mode === 'swap' ? 'Takas' : 'Satılık'}
            </button>
          ))}
          <select
            className="tv-input"
            value={condition === '' ? '' : String(condition)}
            onChange={(e) =>
              setCondition(e.target.value === '' ? '' : (Number(e.target.value) as ExchangeCondition))
            }
            aria-label="Durum filtresi"
          >
            <option value="">Tüm durumlar</option>
            <option value={EXCHANGE_CONDITION.New}>{EXCHANGE_CONDITION_LABELS[1]}</option>
            <option value={EXCHANGE_CONDITION.Used}>{EXCHANGE_CONDITION_LABELS[2]}</option>
            <option value={EXCHANGE_CONDITION.Healthy}>{EXCHANGE_CONDITION_LABELS[3]}</option>
          </select>
        </div>
      </div>

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      {products.length === 0 ? (
        <p className="tv-muted">Henüz aktif ilan yok.</p>
      ) : (
        <ul className="tv-product-grid">
          {products.map((product) => (
            <li key={product.id} className="tv-card tv-product-card">
              {product.photoUrls[0] ? (
                <OptimizedMediaImage
                  src={product.photoUrls[0]}
                  alt={product.title}
                  width={320}
                  height={200}
                  className="tv-product-card__image"
                />
              ) : (
                <div className="tv-product-card__image tv-product-card__image--placeholder" />
              )}
              <div className="tv-product-card__body">
                <h2 className="tv-product-card__title">{product.title}</h2>
                <p className="tv-muted">{product.ownerDisplayName}</p>
                <p>{EXCHANGE_CONDITION_LABELS[product.condition]}</p>
                <p className="tv-product-card__price">
                  {product.isSwapOnly ? 'Takaslık' : formatTryCurrency(product.price)}
                </p>
                <Link
                  href={`/marketplace/${product.id}`}
                  className="tv-btn tv-btn--primary"
                  onClick={(e) => {
                    if (!tokenStore.getToken()) {
                      e.preventDefault();
                      router.push('/login');
                    }
                  }}
                >
                  Detay / Teklif ver
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
