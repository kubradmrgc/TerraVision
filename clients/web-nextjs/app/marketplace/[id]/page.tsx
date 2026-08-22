'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  EXCHANGE_CONDITION_LABELS,
  EXCHANGE_OFFER_TYPE,
  EXCHANGE_OFFER_TYPE_LABELS,
  ExchangeOfferType,
  ExchangeProductDto,
  formatTryCurrency
} from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { exchangeService } from '@/services/exchangeService';
import { realtimeService } from '@/services/realtimeService';
import { tokenStore } from '@/services/tokenStore';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';

export default function MarketplaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);
  const [product, setProduct] = useState<ExchangeProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerType, setOfferType] = useState<ExchangeOfferType>(EXCHANGE_OFFER_TYPE.Swap);
  const [message, setMessage] = useState('');
  const [isMutating, setIsMutating] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(productId)) {
      setError('Geçersiz ilan.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const item = await exchangeService.getProduct(productId);
      setProduct(item);
      setOfferType(item.isSwapOnly ? EXCHANGE_OFFER_TYPE.Swap : EXCHANGE_OFFER_TYPE.Buy);
    } catch (err) {
      setError(getApiErrorMessage(err, 'İlan yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!tokenStore.getToken()) {
      return;
    }
    void realtimeService.connect();
    return realtimeService.onExchangeOfferStatusChanged(() => {
      void load();
    });
  }, [load]);

  const submitOffer = async () => {
    if (!tokenStore.getToken()) {
      router.replace('/login');
      return;
    }
    setIsMutating(true);
    setError(null);
    setSuccess(null);
    try {
      await exchangeService.createOffer({
        productId,
        offerType,
        message
      });
      setSuccess('Teklifiniz gönderildi. İlan sahibi anında bilgilendirilir.');
      setOfferOpen(false);
      setMessage('');
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(err, 'Teklif gönderilemedi.'));
    } finally {
      setIsMutating(false);
    }
  };

  if (loading) {
    return (
      <div className="tv-takas-loading" aria-busy="true">
        <div className="tv-takas-skeleton" style={{ height: 360 }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="tv-card tv-takas-empty">
        <p className="tv-error">{error ?? 'İlan bulunamadı.'}</p>
        <Link href="/marketplace" className="tv-btn tv-btn--primary">
          ← Pazara dön
        </Link>
      </div>
    );
  }

  return (
    <div className="tv-takas-detail-page">
      <p className="tv-page-actions">
        <Link href="/marketplace">← TerraTakas pazarı</Link>
      </p>

      <div className="tv-takas-detail">
        <section>
          <div className="tv-takas-card__badges" style={{ position: 'static', marginBottom: 12 }}>
            <span className={`tv-takas-pill ${product.isSwapOnly ? 'tv-takas-pill--swap' : 'tv-takas-pill--sale'}`}>
              {product.isSwapOnly ? 'Takas' : 'Satılık'}
            </span>
            <span className="tv-takas-pill tv-takas-pill--condition">
              {EXCHANGE_CONDITION_LABELS[product.condition]}
            </span>
          </div>
          <h1 className="tv-page-title">{product.title}</h1>
          <p className="tv-page-lead">
            {product.ownerDisplayName} ·{' '}
            {product.isSwapOnly ? 'Takaslık ilan' : formatTryCurrency(product.price)}
          </p>
          <p style={{ lineHeight: 1.6, marginBottom: 20 }}>{product.description}</p>

          {product.photoUrls.length > 0 ? (
            <div className="tv-takas-gallery">
              {product.photoUrls.map((url) => (
                <OptimizedMediaImage key={url} src={url} alt={product.title} width={320} height={240} />
              ))}
            </div>
          ) : (
            <div className="tv-card tv-takas-empty" style={{ padding: 32 }}>
              <span className="tv-takas-empty-icon">📷</span>
              <p className="tv-muted">Fotoğraf eklenmemiş</p>
            </div>
          )}
        </section>

        <aside className="tv-takas-detail-panel">
          <div className="tv-card">
            <h2 className="tv-section-title">Teklif ver</h2>
            <p className="tv-muted" style={{ marginBottom: 16 }}>
              Mesajınızda link paylaşmayın. İlan sahibi teklifinizi kabul veya reddedebilir.
            </p>
            {success ? (
              <p className="tv-success" role="status">
                {success}
              </p>
            ) : null}
            {error ? (
              <p className="tv-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              className="tv-btn tv-btn--primary"
              style={{ width: '100%' }}
              disabled={isMutating}
              onClick={() => {
                if (!tokenStore.getToken()) {
                  router.push('/login');
                  return;
                }
                setOfferOpen(true);
              }}
            >
              Teklif gönder
            </button>
          </div>
        </aside>
      </div>

      {offerOpen ? (
        <div
          className="tv-takas-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-dialog-title"
          onClick={() => !isMutating && setOfferOpen(false)}
        >
          <div className="tv-card tv-takas-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="offer-dialog-title" className="tv-section-title">
              Teklifiniz
            </h2>
            <p className="tv-muted">{product.title}</p>

            <div className="tv-takas-type-toggle">
              <button
                type="button"
                className={`tv-takas-type-btn${offerType === EXCHANGE_OFFER_TYPE.Swap ? ' tv-takas-type-btn--active' : ''}`}
                disabled={isMutating}
                onClick={() => setOfferType(EXCHANGE_OFFER_TYPE.Swap)}
              >
                {EXCHANGE_OFFER_TYPE_LABELS[1]}
              </button>
              {!product.isSwapOnly ? (
                <button
                  type="button"
                  className={`tv-takas-type-btn${offerType === EXCHANGE_OFFER_TYPE.Buy ? ' tv-takas-type-btn--active' : ''}`}
                  disabled={isMutating}
                  onClick={() => setOfferType(EXCHANGE_OFFER_TYPE.Buy)}
                >
                  {EXCHANGE_OFFER_TYPE_LABELS[2]}
                </button>
              ) : (
                <span className="tv-takas-type-btn tv-muted" style={{ cursor: 'default', opacity: 0.6 }}>
                  Yalnızca takas
                </span>
              )}
            </div>

            <div className="tv-field">
              <label htmlFor="offer-message">Mesaj</label>
              <textarea
                id="offer-message"
                rows={4}
                value={message}
                disabled={isMutating}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Örn. Monstera ile takas yapabilirim…"
              />
            </div>

            <div className="tv-takas-offer-actions">
              <button
                type="button"
                className="tv-btn tv-btn--primary"
                disabled={isMutating}
                onClick={() => void submitOffer()}
              >
                {isMutating ? 'Gönderiliyor…' : 'Gönder'}
              </button>
              <button type="button" className="tv-btn" disabled={isMutating} onClick={() => setOfferOpen(false)}>
                İptal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
