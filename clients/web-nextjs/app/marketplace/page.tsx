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
import { getApiErrorMessage } from '@/utils/apiError';

type FilterMode = 'all' | 'swap' | 'sale';

function TakasHero() {
  const loggedIn = Boolean(tokenStore.getToken());
  return (
    <header className="tv-takas-hero">
      <span className="tv-login-pill">TerraTakas</span>
      <h1 className="tv-takas-hero-title">Topluluk pazarı</h1>
      <p className="tv-takas-hero-lead">
        Bitkilerinizi ve saksılarınızı komşularınızla takas edin veya uygun fiyata devredin. Canlı
        ilanlar anında listeye düşer.
      </p>
      <div className="tv-takas-hero-actions">
        {loggedIn ? (
          <Link href="/profile/exchange" className="tv-btn tv-btn--primary">
            İlan ver / Tekliflerim
          </Link>
        ) : (
          <Link href="/login" className="tv-btn tv-btn--primary">
            Giriş yap ve teklif ver
          </Link>
        )}
        <Link href="/products" className="tv-btn">
          Mağazaya dön
        </Link>
      </div>
    </header>
  );
}

function ProductCard({
  product,
  onRequireLogin
}: {
  product: ExchangeProductDto;
  onRequireLogin: () => void;
}) {
  return (
    <li className="tv-card tv-takas-card">
      <div className="tv-takas-card__media">
        {product.photoUrls[0] ? (
          <OptimizedMediaImage
            src={product.photoUrls[0]}
            alt={product.title}
            width={400}
            height={300}
            sizes="(max-width: 640px) 100vw, 280px"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="tv-takas-card__media--empty" aria-hidden>
            🪴
          </div>
        )}
        <div className="tv-takas-card__badges">
          <span className={`tv-takas-pill ${product.isSwapOnly ? 'tv-takas-pill--swap' : 'tv-takas-pill--sale'}`}>
            {product.isSwapOnly ? 'Takas' : 'Satılık'}
          </span>
          <span className="tv-takas-pill tv-takas-pill--condition">
            {EXCHANGE_CONDITION_LABELS[product.condition]}
          </span>
        </div>
      </div>
      <div className="tv-takas-card__body">
        <h2 className="tv-takas-card__title">{product.title}</h2>
        <p className="tv-takas-card__owner">{product.ownerDisplayName}</p>
        <p className="tv-takas-card__price">
          {product.isSwapOnly ? 'Takaslık ilan' : formatTryCurrency(product.price)}
        </p>
        <Link
          href={`/marketplace/${product.id}`}
          className="tv-btn tv-btn--primary tv-takas-card__cta"
          onClick={(e) => {
            if (!tokenStore.getToken()) {
              e.preventDefault();
              onRequireLogin();
            }
          }}
        >
          İncele ve teklif ver
        </Link>
      </div>
    </li>
  );
}

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

  const swapCount = useMemo(() => products.filter((p) => p.isSwapOnly).length, [products]);
  const saleCount = useMemo(() => products.filter((p) => !p.isSwapOnly).length, [products]);

  return (
    <div className="tv-takas-page">
      <TakasHero />

      <div className="tv-takas-stat-row" aria-live="polite">
        <span className="tv-takas-stat">
          <strong>{products.length}</strong> aktif ilan
        </span>
        <span className="tv-takas-stat">
          <strong>{swapCount}</strong> takas
        </span>
        <span className="tv-takas-stat">
          <strong>{saleCount}</strong> satılık
        </span>
      </div>

      <div className="tv-takas-toolbar">
        <div className="tv-takas-filter-group" role="group" aria-label="İlan türü">
          {(['all', 'swap', 'sale'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`tv-takas-filter-btn${filterMode === mode ? ' tv-takas-filter-btn--active' : ''}`}
              onClick={() => setFilterMode(mode)}
            >
              {mode === 'all' ? 'Tümü' : mode === 'swap' ? 'Takas' : 'Satılık'}
            </button>
          ))}
        </div>
        <select
          className="tv-takas-select"
          value={condition === '' ? '' : String(condition)}
          onChange={(e) =>
            setCondition(e.target.value === '' ? '' : (Number(e.target.value) as ExchangeCondition))
          }
          aria-label="Bitki durumu"
        >
          <option value="">Tüm durumlar</option>
          <option value={EXCHANGE_CONDITION.New}>{EXCHANGE_CONDITION_LABELS[1]}</option>
          <option value={EXCHANGE_CONDITION.Used}>{EXCHANGE_CONDITION_LABELS[2]}</option>
          <option value={EXCHANGE_CONDITION.Healthy}>{EXCHANGE_CONDITION_LABELS[3]}</option>
        </select>
      </div>

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="tv-takas-loading" aria-busy="true" aria-label="Yükleniyor">
          {[0, 1, 2].map((i) => (
            <div key={i} className="tv-takas-skeleton" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="tv-card tv-takas-empty">
          <div className="tv-takas-empty-icon" aria-hidden>
            🌱
          </div>
          <p className="tv-section-title">Henüz ilan yok</p>
          <p className="tv-muted">İlk ilanı siz verin veya filtreleri gevşetin.</p>
          {tokenStore.getToken() ? (
            <Link href="/profile/exchange" className="tv-btn tv-btn--primary" style={{ marginTop: 16 }}>
              İlan oluştur
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="tv-takas-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onRequireLogin={() => router.push('/login')}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
