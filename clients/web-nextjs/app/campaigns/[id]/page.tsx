'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import type { CampaignDetailDto } from '@terravision/shared';
import { MarketplaceProductCard } from '@/components/storefront/MarketplaceProductCard';
import { campaignService } from '@/services/campaignService';
import { cartService } from '@/services/cartService';
import { tokenStore } from '@/services/tokenStore';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import type { ProductDto } from '@/types/product';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = Number(params.id);
  const [detail, setDetail] = useState<CampaignDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(campaignId)) {
      setError('Geçersiz kampanya.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getStorefrontCampaign(campaignId);
      setDetail(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('Kampanya bulunamadı veya şu an aktif değil.');
      } else {
        setError(getApiErrorMessage(err, 'Kampanya yüklenemedi.'));
      }
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddToCart = async (product: ProductDto) => {
    if (!tokenStore.getToken()) {
      setNotice('Sepete eklemek için giriş yapın.');
      return;
    }
    setAddingId(product.id);
    setNotice(null);
    try {
      await cartService.addItem(product.id, 1);
      setNotice(`${product.name} sepete eklendi.`);
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        setNotice('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
      } else {
        setNotice(getApiErrorMessage(err, 'Sepete eklenemedi.'));
      }
    } finally {
      setAddingId(null);
    }
  };

  const campaign = detail?.campaign;

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <p className="tv-page-actions" style={{ marginBottom: 8 }}>
          <Link href="/products">← Ürünlere dön</Link>
        </p>
        {loading ? <p className="tv-muted">Yükleniyor…</p> : null}
        {error ? (
          <p className="tv-error" role="alert">
            {error}
          </p>
        ) : null}
        {campaign ? (
          <>
            {campaign.badgeText ? <span className="tv-badge-ar">{campaign.badgeText}</span> : null}
            <h1 className="tv-page-title" style={{ marginTop: 8 }}>
              {campaign.title}
            </h1>
            {campaign.subtitle ? <p className="tv-page-lead">{campaign.subtitle}</p> : null}
            <p className="tv-muted">{detail!.products.length} ürün</p>
          </>
        ) : null}
      </header>

      {notice ? (
        <p className="tv-success" role="status" style={{ marginBottom: 16 }}>
          {notice}
        </p>
      ) : null}

      {!loading && !error && detail ? (
        detail.products.length > 0 ? (
          <div className="tv-marketplace-grid">
            {detail.products.map((p) => (
              <MarketplaceProductCard
                key={p.id}
                product={p}
                adding={addingId === p.id}
                onAdd={() => void handleAddToCart(p)}
              />
            ))}
          </div>
        ) : (
          <p className="tv-muted">Bu kampanyaya henüz ürün bağlanmamış.</p>
        )
      ) : null}
    </div>
  );
}
