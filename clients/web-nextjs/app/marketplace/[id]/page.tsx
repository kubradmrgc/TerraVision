'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
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
      setSuccess('Teklifiniz gönderildi.');
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
    return <p className="tv-muted">Yükleniyor…</p>;
  }

  if (!product) {
    return (
      <div>
        <p className="tv-error">{error ?? 'İlan bulunamadı.'}</p>
        <Link href="/marketplace">← Pazara dön</Link>
      </div>
    );
  }

  return (
    <div>
      <p className="tv-page-actions">
        <Link href="/marketplace">← TerraTakas</Link>
      </p>
      <h1 className="tv-page-title">{product.title}</h1>
      <p className="tv-page-lead">
        {product.ownerDisplayName} · {EXCHANGE_CONDITION_LABELS[product.condition]} ·{' '}
        {product.isSwapOnly ? 'Takaslık' : formatTryCurrency(product.price)}
      </p>
      <p>{product.description}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '16px 0' }}>
        {product.photoUrls.map((url) => (
          <OptimizedMediaImage key={url} src={url} alt={product.title} width={200} height={140} />
        ))}
      </div>

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

      <button
        type="button"
        className="tv-btn tv-btn--primary"
        disabled={isMutating}
        onClick={() => {
          if (!tokenStore.getToken()) {
            router.push('/login');
            return;
          }
          setOfferOpen(true);
        }}
      >
        Teklif ver
      </button>

      {offerOpen ? (
        <div className="tv-card" style={{ marginTop: 16, padding: 16 }}>
          <h2 className="tv-section-title">Teklif türü</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              className={`tv-btn${offerType === EXCHANGE_OFFER_TYPE.Swap ? ' tv-btn--primary' : ''}`}
              disabled={isMutating}
              onClick={() => setOfferType(EXCHANGE_OFFER_TYPE.Swap)}
            >
              {EXCHANGE_OFFER_TYPE_LABELS[1]}
            </button>
            {!product.isSwapOnly ? (
              <button
                type="button"
                className={`tv-btn${offerType === EXCHANGE_OFFER_TYPE.Buy ? ' tv-btn--primary' : ''}`}
                disabled={isMutating}
                onClick={() => setOfferType(EXCHANGE_OFFER_TYPE.Buy)}
              >
                {EXCHANGE_OFFER_TYPE_LABELS[2]}
              </button>
            ) : null}
          </div>
          <label className="tv-label" htmlFor="offer-message">
            Mesajınız
          </label>
          <textarea
            id="offer-message"
            className="tv-input"
            rows={3}
            value={message}
            disabled={isMutating}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Takas teklifinizi kısaca yazın (link içermeyin)"
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
      ) : null}
    </div>
  );
}
