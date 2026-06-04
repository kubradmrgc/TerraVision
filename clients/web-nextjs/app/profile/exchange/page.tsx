'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  EXCHANGE_CONDITION,
  EXCHANGE_CONDITION_LABELS,
  type ExchangeCondition,
  EXCHANGE_OFFER_STATUS,
  EXCHANGE_OFFER_STATUS_LABELS,
  EXCHANGE_OFFER_TYPE_LABELS,
  ExchangeOfferDto,
  ExchangeOfferStatus,
  ExchangeProductDto,
  formatTryCurrency
} from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { ExchangeConditionTags } from '@/components/exchange/ExchangeConditionTags';
import { ProfileSubnav } from '@/components/profile/ProfileSubnav';
import { exchangeService } from '@/services/exchangeService';
import { realtimeService } from '@/services/realtimeService';
import { tokenStore } from '@/services/tokenStore';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';

type Tab = 'listings' | 'received' | 'sent';

function offerStatusClass(status: ExchangeOfferStatus): string {
  if (status === EXCHANGE_OFFER_STATUS.Accepted) return 'tv-takas-status--accepted';
  if (status === EXCHANGE_OFFER_STATUS.Rejected) return 'tv-takas-status--rejected';
  return 'tv-takas-status--pending';
}

function OfferCard({
  offer,
  showActions,
  isMutating,
  onAccept,
  onReject
}: {
  offer: ExchangeOfferDto;
  showActions?: boolean;
  isMutating: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  return (
    <li className="tv-card tv-takas-offer-card">
      <div className="tv-takas-offer-header">
        <h3 className="tv-takas-offer-title">{offer.productTitle}</h3>
        <span className={`tv-takas-status ${offerStatusClass(offer.status)}`}>
          {EXCHANGE_OFFER_STATUS_LABELS[offer.status]}
        </span>
      </div>
      <p className="tv-takas-offer-meta">
        {offer.senderDisplayName} · {EXCHANGE_OFFER_TYPE_LABELS[offer.offerType]}
      </p>
      {offer.message ? <p className="tv-takas-offer-message">{offer.message}</p> : null}
      {showActions && offer.status === EXCHANGE_OFFER_STATUS.Pending ? (
        <div className="tv-takas-offer-actions">
          <button
            type="button"
            className="tv-btn tv-btn--primary tv-btn--compact"
            disabled={isMutating}
            onClick={onAccept}
          >
            Kabul et
          </button>
          <button type="button" className="tv-btn tv-btn--compact" disabled={isMutating} onClick={onReject}>
            Reddet
          </button>
        </div>
      ) : null}
    </li>
  );
}

export default function ProfileExchangePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
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
  const [newCondition, setNewCondition] = useState<ExchangeCondition>(EXCHANGE_CONDITION.Healthy);
  const [uploading, setUploading] = useState(false);

  const pendingReceived = useMemo(
    () => received.filter((o) => o.status === EXCHANGE_OFFER_STATUS.Pending).length,
    [received]
  );

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
    if (!newTitle.trim()) {
      setError('Başlık zorunludur.');
      return;
    }
    if (!newPhotoUrl.trim()) {
      setError('En az bir fotoğraf yükleyin.');
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
        condition: newCondition,
        photoUrls: [newPhotoUrl.trim()]
      });
      setNewTitle('');
      setNewDescription('');
      setNewPrice('0');
      setNewPhotoUrl('');
      setNewCondition(EXCHANGE_CONDITION.Healthy);
      setSuccess('İlanınız yayınlandı ve pazarda görünür.');
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
    return (
      <div className="tv-takas-loading" aria-busy="true">
        <div className="tv-takas-skeleton" style={{ height: 120 }} />
        <div className="tv-takas-skeleton" style={{ height: 280 }} />
      </div>
    );
  }

  return (
    <div className="tv-takas-dashboard">
      <ProfileSubnav />
      <header className="tv-takas-hero" style={{ marginBottom: 20 }}>
        <span className="tv-login-pill">TerraTakas</span>
        <h1 className="tv-takas-hero-title">İlanlarım ve teklifler</h1>
        <p className="tv-takas-hero-lead">İlanlarınızı yönetin, gelen teklifleri anında görün ve yanıtlayın.</p>
        <div className="tv-takas-hero-actions">
          <Link href="/marketplace" className="tv-btn">
            Pazarı görüntüle
          </Link>
        </div>
      </header>

      <div className="tv-takas-tabs" role="tablist">
        {(
          [
            ['listings', 'İlanlarım', myProducts.length],
            ['received', 'Gelen teklifler', pendingReceived],
            ['sent', 'Gönderdiğim', sent.length]
          ] as const
        ).map(([key, label, badge]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`tv-takas-tab${tab === key ? ' tv-takas-tab--active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
            {badge > 0 ? <span className="tv-takas-tab-badge">{badge}</span> : null}
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
          <div className="tv-card" style={{ marginBottom: 24 }}>
            <h2 className="tv-section-title">Yeni ilan oluştur</h2>
            <div className="tv-takas-form">
              <div className="tv-field">
                <label htmlFor="listing-title">Başlık</label>
                <input
                  id="listing-title"
                  type="text"
                  value={newTitle}
                  disabled={isMutating}
                  placeholder="Örn. Sağlıklı Monstera"
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="tv-field">
                <label htmlFor="listing-desc">Açıklama</label>
                <textarea
                  id="listing-desc"
                  rows={3}
                  value={newDescription}
                  disabled={isMutating}
                  placeholder="Bitkinin durumu, bakım geçmişi…"
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <ExchangeConditionTags
                value={newCondition}
                onChange={setNewCondition}
                disabled={isMutating || uploading}
                idPrefix="listing-tag"
              />
              <div className="tv-takas-form-row">
                <div className="tv-field">
                  <label htmlFor="listing-price">Fiyat (₺)</label>
                  <input
                    id="listing-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={newPrice}
                    disabled={isMutating}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                  <p className="tv-field-hint">0 girerseniz ilan yalnızca takas için listelenir.</p>
                </div>
              </div>
              <div
                className="tv-takas-photo-drop"
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={isMutating || uploading}
                  onChange={(e) => void handleImageUpload(e.target.files?.[0] ?? null)}
                />
                {newPhotoUrl ? (
                  <OptimizedMediaImage
                    src={newPhotoUrl}
                    alt="Önizleme"
                    width={400}
                    height={240}
                    className="tv-takas-photo-preview"
                  />
                ) : (
                  <>
                    <span style={{ fontSize: 28 }}>📷</span>
                    <span className="tv-muted">{uploading ? 'Yükleniyor…' : 'Fotoğraf seç veya sürükle'}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                className="tv-btn tv-btn--primary"
                disabled={isMutating || uploading}
                onClick={() => void handleCreateListing()}
              >
                {isMutating ? 'Yayınlanıyor…' : 'İlanı yayınla'}
              </button>
            </div>
          </div>

          {myProducts.length === 0 ? (
            <div className="tv-card tv-takas-empty">
              <p className="tv-muted">Henüz ilanınız yok.</p>
            </div>
          ) : (
            <ul className="tv-takas-grid">
              {myProducts.map((p) => (
                <li key={p.id} className="tv-card tv-takas-card">
                  <div className="tv-takas-card__media">
                    {p.photoUrls[0] ? (
                      <OptimizedMediaImage
                        src={p.photoUrls[0]}
                        alt={p.title}
                        width={320}
                        height={240}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="tv-takas-card__media tv-takas-card__media--empty">🪴</div>
                    )}
                  </div>
                  <div className="tv-takas-card__body">
                    <div className="tv-takas-card__badges" style={{ position: 'static', marginBottom: 8 }}>
                      <span className="tv-takas-pill tv-takas-pill--condition">
                        {EXCHANGE_CONDITION_LABELS[p.condition]}
                      </span>
                    </div>
                    <h2 className="tv-takas-card__title">{p.title}</h2>
                    <p className="tv-takas-card__price">
                      {p.isSwapOnly ? 'Takaslık' : formatTryCurrency(p.price)}
                    </p>
                    <Link href={`/marketplace/${p.id}`} className="tv-btn tv-takas-card__cta">
                      İlanı görüntüle
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {tab === 'received' ? (
        <ul className="tv-takas-offer-list">
          {received.length === 0 ? (
            <li className="tv-card tv-takas-empty">
              <p className="tv-muted">Henüz gelen teklif yok.</p>
            </li>
          ) : (
            received.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                showActions
                isMutating={isMutating}
                onAccept={() => void handleOfferAction(offer.id, true)}
                onReject={() => void handleOfferAction(offer.id, false)}
              />
            ))
          )}
        </ul>
      ) : null}

      {tab === 'sent' ? (
        <ul className="tv-takas-offer-list">
          {sent.length === 0 ? (
            <li className="tv-card tv-takas-empty">
              <p className="tv-muted">Henüz teklif göndermediniz.</p>
              <Link href="/marketplace" className="tv-btn tv-btn--primary" style={{ marginTop: 12 }}>
                Pazara git
              </Link>
            </li>
          ) : (
            sent.map((offer) => <OfferCard key={offer.id} offer={offer} isMutating={isMutating} />)
          )}
        </ul>
      ) : null}
    </div>
  );
}
