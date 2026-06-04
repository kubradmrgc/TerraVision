'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { campaignService } from '@/services/campaignService';
import { productService } from '@/services/productService';
import type { StoreCampaignDto, UpsertStoreCampaignRequest } from '@terravision/shared';
import type { ProductDto } from '@/types/product';
import { getApiErrorMessage } from '@/utils/apiError';

type FormState = {
  title: string;
  subtitle: string;
  badgeText: string;
  sortOrder: string;
  isActive: boolean;
  productIds: number[];
};

const EMPTY: FormState = {
  title: '',
  subtitle: '',
  badgeText: 'KAMPANYA',
  sortOrder: '0',
  isActive: true,
  productIds: []
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<StoreCampaignDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, p] = await Promise.all([campaignService.getCampaigns(), productService.getProducts()]);
      setCampaigns(c);
      setProducts(p);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Kampanyalar yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedProducts = useMemo(
    () => products.filter((p) => form.productIds.includes(p.id)),
    [products, form.productIds]
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const startEdit = (c: StoreCampaignDto) => {
    setEditingId(c.id);
    setForm({
      title: c.title,
      subtitle: c.subtitle ?? '',
      badgeText: c.badgeText ?? '',
      sortOrder: String(c.sortOrder),
      isActive: c.isActive,
      productIds: [...c.productIds]
    });
    setNotice(null);
    setError(null);
  };

  const toggleProduct = (id: number) => {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((x) => x !== id)
        : [...prev.productIds, id]
    }));
  };

  const buildRequest = (): UpsertStoreCampaignRequest => ({
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || null,
    badgeText: form.badgeText.trim() || null,
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive,
    productIds: form.productIds
  });

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Kampanya başlığı zorunlu.');
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const body = buildRequest();
      if (editingId) {
        await campaignService.updateCampaign(editingId, body);
        setNotice('Kampanya güncellendi.');
      } else {
        await campaignService.createCampaign(body);
        setNotice('Kampanya oluşturuldu.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Kayıt başarısız.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
    setSaving(true);
    try {
      await campaignService.deleteCampaign(id);
      if (editingId === id) resetForm();
      setNotice('Kampanya silindi.');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Silinemedi.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell
      title="Mağaza kampanyaları"
      lead="Kampanya bannerları, rozet metinleri ve vitrin ürünlerini yönetin."
    >
      {loading ? <p className="tv-muted">Yükleniyor…</p> : null}
      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="tv-success" role="status">
          {notice}
        </p>
      ) : null}

      <div className="tv-admin-layout">
        <div className="tv-card tv-admin-form-card">
          <h2 className="tv-section-title">{editingId ? 'Kampanyayı düzenle' : 'Yeni kampanya'}</h2>
          <div className="tv-admin-form-grid">
            <label className="tv-admin-field">
              <span>Başlık *</span>
              <input
                className="tv-input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Örn. Bahar Kampanyası"
              />
            </label>
            <label className="tv-admin-field">
              <span>Alt başlık</span>
              <input
                className="tv-input"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Kısa açıklama"
              />
            </label>
            <label className="tv-admin-field">
              <span>Rozet metni</span>
              <input
                className="tv-input"
                value={form.badgeText}
                onChange={(e) => setForm((f) => ({ ...f, badgeText: e.target.value }))}
                placeholder="%30 veya KAMPANYA"
              />
            </label>
            <label className="tv-admin-field">
              <span>Sıra</span>
              <input
                className="tv-input"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </label>
            <label className="tv-admin-field tv-admin-field--checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <span>Aktif (müşteri vitrininde göster)</span>
            </label>
          </div>

          <h3 className="tv-admin-subtitle">
            Kampanyadaki ürünler <span className="tv-admin-count">{selectedProducts.length}</span>
          </h3>
          <div className="tv-marketplace-picker tv-admin-product-picker">
            {products.map((p) => {
              const checked = form.productIds.includes(p.id);
              return (
                <label key={p.id} className={`tv-marketplace-picker-item${checked ? ' is-selected' : ''}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleProduct(p.id)} />
                  <span>
                    {p.name} — {p.price} ₺
                    {p.compareAtPrice && p.compareAtPrice > p.price ? ` (liste ${p.compareAtPrice} ₺)` : ''}
                  </span>
                </label>
              );
            })}
          </div>

          <p className="tv-muted tv-admin-tip">
            İndirim için ürün kaydında <strong>liste fiyatı</strong> alanını satış fiyatından yüksek girin.
          </p>

          <div className="tv-admin-form-actions">
            <button type="button" className="tv-btn tv-btn--primary" disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Kaydediliyor…' : editingId ? 'Güncelle' : 'Oluştur'}
            </button>
            {editingId ? (
              <button type="button" className="tv-btn" disabled={saving} onClick={resetForm}>
                İptal
              </button>
            ) : null}
          </div>
        </div>

        <aside className="tv-card tv-admin-preview-card">
          <h2 className="tv-section-title">Mevcut kampanyalar</h2>
          {campaigns.length === 0 && !loading ? <p className="tv-muted">Henüz kampanya yok.</p> : null}
          <ul className="tv-admin-campaign-list">
            {campaigns.map((c) => (
              <li key={c.id} className="tv-admin-campaign-item">
                <div className="tv-admin-campaign-item-body">
                  <div className="tv-admin-campaign-item-head">
                    <strong>{c.title}</strong>
                    {c.badgeText ? <span className="tv-badge-ar">{c.badgeText}</span> : null}
                  </div>
                  <p className="tv-muted">{c.subtitle || 'Alt başlık yok'}</p>
                  <p className="tv-admin-campaign-meta">
                    {c.productIds.length} ürün ·{' '}
                    <span className={c.isActive ? 'tv-pill tv-pill--ok' : 'tv-pill tv-pill--muted'}>
                      {c.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </p>
                </div>
                <div className="tv-admin-campaign-item-actions">
                  <button type="button" className="tv-btn tv-btn--compact" onClick={() => startEdit(c)}>
                    Düzenle
                  </button>
                  <button type="button" className="tv-btn tv-btn--compact" onClick={() => void handleDelete(c.id)}>
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AdminPageShell>
  );
}
