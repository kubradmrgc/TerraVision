'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  EXCHANGE_CONDITION,
  EXCHANGE_CONDITION_LABELS,
  EXCHANGE_OFFER_STATUS,
  EXCHANGE_OFFER_STATUS_LABELS,
  EXCHANGE_OFFER_TYPE_LABELS,
  ExchangeOfferDto,
  ExchangeProductDto,
  formatTryCurrency
} from '@terravision/shared';
import { exchangeService } from '@/services/exchangeService';
import { realtimeService } from '@/services/realtimeService';
import { tokenStore } from '@/services/tokenStore';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';

type Tab = 'listings' | 'received' | 'sent';

export default function ProfileExchangePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('listings');
  const [myProducts, setMyProducts] = useState<ExchangeProductDto[]>([]);
  const [received, setReceived] = useState<ExchangeOfferDto[]>([]);
  const [sent, setSent] = useState<ExchangeOfferDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('0');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!tokenStore.getToken()) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [mine, recv, snt] = await Promise.all([
        exchangeService.getMyProducts(),
        exchangeService.getReceivedOffers(),
        exchangeService.getSentOffers()
      ]);
      setMyProducts(mine);
      setReceived(recv);
      setSent(snt);
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(err, 'TerraTakas verileri yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void realtimeService.connect();
    const unsubOffer = realtimeService.onExchangeOfferReceived(() => {
      void load();
    });
    const unsubStatus = realtimeService.onExchangeOfferStatusChanged(() => {
      void load();
    });
    const unsubListed = realtimeService.onExchangeProductListed(() => {
      void load();
    });
    return () => {
      unsubOffer();
      unsubStatus();
      unsubListed();
    };
  }, [load]);

  const handleOfferAction = async (offerId: number, accept: boolean) => {
    setIsMutating(true);
    setError(null);
    setSuccess(null);
    try {
      if (accept) {
        await exchangeService.acceptOffer(offerId);
        setSuccess('Teklif kabul edildi.');
      } else {
        await exchangeService.rejectOffer(offerId);
        setSuccess('Teklif reddedildi.');
      }
      await load();
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(err, 'Teklif güncellenemedi.'));
    } finally {
      setIsMutating(false);
    }
  };

  const handleCreateListing = async () => {
    if (!newPhotoUrl.trim()) {
      setError('En az bir fotoğraf URL’si ekleyin.');
      return;
    }
    setIsMutating(true);
    setError(null);
    setSuccess(null);
    try {
      await exchangeService.createProduct({
        title: newTitle.trim(),
        description: newDescription.trim(),
        price: Number(newPrice) || 0,
        condition: EXCHANGE_CONDITION.Healthy,
        photoUrls: [newPhotoUrl.trim()]
      });
      setNewTitle('');
      setNewDescription('');
      setNewPrice('0');
      setNewPhotoUrl('');
      setSuccess('İlanınız yayınlandı.');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'İlan oluşturulamadı.'));
    } finally {
      setIsMutating(false);
    }
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await exchangeService.uploadImage(file);
      setNewPhotoUrl(url);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Fotoğraf yüklenemedi.'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <p className="tv-muted">Yükleniyor…</p>;
  }

  return (
    <div>
      <h1 className="tv-page-title">TerraTakas — İlanlarım</h1>
      <p className="tv-page-lead">İlanlarınızı yönetin, gelen teklifleri kabul edin veya reddedin.</p>
      <p className="tv-page-actions">
        <Link href="/marketplace">Pazarı görüntüle →</Link>
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(
          [
            ['listings', 'İlanlarım'],
            ['received', 'Gelen teklifler'],
            ['sent', 'Gönderdiğim teklifler']
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`tv-btn${tab === key ? ' tv-btn--primary' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
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

      {tab === 'listings' ? (
        <>
          <div className="tv-card" style={{ padding: 16, marginBottom: 16 }}>
            <h2 className="tv-section-title">Yeni ilan</h2>
            <input
              className="tv-input"
              placeholder="Başlık"
              value={newTitle}
              disabled={isMutating}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              className="tv-input"
              style={{ marginTop: 8 }}
              placeholder="Açıklama"
              rows={2}
              value={newDescription}
              disabled={isMutating}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <input
              className="tv-input"
              style={{ marginTop: 8 }}
              type="number"
              min={0}
              step="0.01"
              placeholder="Fiyat (0 = takas)"
              value={newPrice}
              disabled={isMutating}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <input
              className="tv-input"
              style={{ marginTop: 8 }}
              type="file"
              accept="image/*"
              disabled={isMutating || uploading}
              onChange={(e) => void handleImageUpload(e.target.files?.[0] ?? null)}
            />
            {newPhotoUrl ? (
              <p className="tv-muted" style={{ marginTop: 8 }}>
                Fotoğraf hazır
              </p>
            ) : null}
            <button
              type="button"
              className="tv-btn tv-btn--primary"
              style={{ marginTop: 12 }}
              disabled={isMutating || uploading}
              onClick={() => void handleCreateListing()}
            >
              {isMutating ? 'Kaydediliyor…' : 'İlanı yayınla'}
            </button>
          </div>
          <ul className="tv-product-grid">
            {myProducts.map((p) => (
              <li key={p.id} className="tv-card tv-product-card">
                <div className="tv-product-card__body">
                  <h2 className="tv-product-card__title">{p.title}</h2>
                  <p className="tv-muted">
                    {EXCHANGE_CONDITION_LABELS[p.condition]} ·{' '}
                    {p.isSwapOnly ? 'Takaslık' : formatTryCurrency(p.price)}
                  </p>
                  <Link href={`/marketplace/${p.id}`}>Detay</Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {tab === 'received' ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {received.length === 0 ? (
            <li className="tv-muted">Henüz teklif yok.</li>
          ) : (
            received.map((offer) => (
              <li key={offer.id} className="tv-card" style={{ padding: 16, marginBottom: 12 }}>
                <strong>{offer.productTitle}</strong>
                <p>
                  {offer.senderDisplayName} · {EXCHANGE_OFFER_TYPE_LABELS[offer.offerType]} ·{' '}
                  {EXCHANGE_OFFER_STATUS_LABELS[offer.status]}
                </p>
                <p>{offer.message}</p>
                {offer.status === EXCHANGE_OFFER_STATUS.Pending ? (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      className="tv-btn tv-btn--primary"
                      disabled={isMutating}
                      onClick={() => void handleOfferAction(offer.id, true)}
                    >
                      Kabul et
                    </button>
                    <button
                      type="button"
                      className="tv-btn"
                      disabled={isMutating}
                      onClick={() => void handleOfferAction(offer.id, false)}
                    >
                      Reddet
                    </button>
                  </div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === 'sent' ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sent.map((offer) => (
            <li key={offer.id} className="tv-card" style={{ padding: 16, marginBottom: 12 }}>
              <strong>{offer.productTitle}</strong>
              <p>
                {EXCHANGE_OFFER_TYPE_LABELS[offer.offerType]} ·{' '}
                {EXCHANGE_OFFER_STATUS_LABELS[offer.status]}
              </p>
              <p>{offer.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
