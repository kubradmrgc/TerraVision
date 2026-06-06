'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  PRODUCT_SORT_OPTIONS,
  ProductSortKey,
  filterAndSortProducts,
  isProductFilterActive,
  campaignListPath,
  type StorefrontDto
} from '@terravision/shared';
import { MarketplaceProductCard } from '@/components/storefront/MarketplaceProductCard';
import { campaignService } from '@/services/campaignService';
import { productService } from '@/services/productService';
import { categoryService, type CategoryDto } from '@/services/categoryService';
import { useAuthSession } from '@/hooks/useAuthSession';
import { cartService } from '@/services/cartService';
import { tokenStore } from '@/services/tokenStore';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import type { ProductDto } from '@/types/product';

export default function ProductsPage() {
  const router = useRouter();
  const { ready, isAuthenticated, isAdmin } = useAuthSession();
  const loggedIn = ready && isAuthenticated;
  const showAdminCampaignLink = ready && isAdmin;
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [storefront, setStorefront] = useState<StorefrontDto | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [arOnly, setArOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<ProductSortKey>('relevance');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, sf, cats] = await Promise.all([
        productService.getProducts(),
        campaignService.getStorefront(),
        loggedIn ? categoryService.getCategories().catch(() => [] as CategoryDto[]) : Promise.resolve([] as CategoryDto[])
      ]);
      setProducts(list);
      setStorefront(sf);
      setCategories(cats);
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        setError('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
      } else if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('Bu sayfayı görüntüleme yetkiniz bulunmuyor.');
      } else {
        setError(getApiErrorMessage(err, 'Ürünler yüklenemedi. Lütfen tekrar deneyin.'));
      }
    } finally {
      setLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const filter = useMemo(
    () => ({ search, categoryId, arOnly, inStockOnly, sort }),
    [search, categoryId, arOnly, inStockOnly, sort]
  );

  const visibleProducts = useMemo(() => filterAndSortProducts(products, filter), [products, filter]);
  const filterActive = isProductFilterActive(filter);
  const dealProducts = storefront?.dealProducts ?? [];

  const clearFilters = () => {
    setSearch('');
    setCategoryId(null);
    setArOnly(false);
    setInStockOnly(false);
    setSort('relevance');
  };

  const handleAddToCart = async (product: ProductDto) => {
    if (!tokenStore.getToken()) {
      router.push('/login');
      return;
    }
    setAddingId(product.id);
    setError(null);
    setNotice(null);
    try {
      await cartService.addItem(product.id, 1);
      setNotice(`${product.name} sepete eklendi.`);
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        setError('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
        router.push('/login');
      } else {
        setError(getApiErrorMessage(err, 'Sepete eklenemedi. Lütfen tekrar deneyin.'));
      }
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return <p className="tv-muted">Yükleniyor…</p>;
  }

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <span className="tv-login-pill">Mağaza</span>
        <h1 className="tv-page-title">Ürünler</h1>
        <p className="tv-page-lead">Kampanyalar, indirimli fırsatlar ve tüm katalog — Trendyol tarzı vitrin.</p>
        <p className="tv-page-actions">
          {loggedIn ? <Link href="/cart">Sepetime git →</Link> : <Link href="/login">Giriş yap →</Link>}
          {showAdminCampaignLink ? (
            <>
              {' · '}
              <Link href="/admin/campaigns">Kampanya yönetimi</Link>
            </>
          ) : null}
        </p>
      </header>

      {(storefront?.campaigns ?? []).length > 0 ? (
        <section aria-label="Kampanyalar">
          <h2 className="tv-section-title">Kampanyalar</h2>
          <div className="tv-storefront-campaigns">
            {storefront!.campaigns.map((c) => {
              const href = campaignListPath(c);
              const body = (
                <>
                  {c.badgeText ? <span className="tv-badge-ar" style={{ marginBottom: 8 }}>{c.badgeText}</span> : null}
                  <h3>{c.title}</h3>
                  {c.subtitle ? <p>{c.subtitle}</p> : null}
                  <p style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                    {c.productIds.length > 0
                      ? `${c.productIds.length} ürün · Kampanyayı gör →`
                      : 'Ürün bağlanmadı'}
                  </p>
                </>
              );
              return href ? (
                <Link
                  key={c.id}
                  href={href}
                  className="tv-storefront-campaign-card tv-storefront-campaign-card--link"
                  aria-label={`${c.title} kampanyası — ürün listesi`}
                >
                  {body}
                </Link>
              ) : (
                <article key={c.id} className="tv-storefront-campaign-card">
                  {body}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {dealProducts.length > 0 ? (
        <section aria-label="İndirimli fırsatlar" style={{ marginBottom: 8 }}>
          <h2 className="tv-section-title">İndirimli fırsatlar</h2>
          <div className="tv-storefront-deals">
            {dealProducts.map((p) => (
              <div key={p.id} style={{ flex: '0 0 180px' }}>
                <MarketplaceProductCard product={p} adding={addingId === p.id} onAdd={() => void handleAddToCart(p)} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="tv-card" style={{ marginBottom: 16, padding: 16 }}>
        <input
          type="search"
          className="tv-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ürün adı, açıklama veya SKU ara…"
          aria-label="Ürün ara"
          style={{ marginBottom: 12 }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {categories.length > 0 ? (
            <select
              className="tv-input"
              value={categoryId == null ? '' : String(categoryId)}
              onChange={(e) => setCategoryId(e.target.value === '' ? null : Number(e.target.value))}
              aria-label="Kategori filtresi"
              style={{ width: 'auto' }}
            >
              <option value="">Tüm kategoriler</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : null}
          <select
            className="tv-input"
            value={sort}
            onChange={(e) => setSort(e.target.value as ProductSortKey)}
            aria-label="Sıralama"
            style={{ width: 'auto' }}
          >
            {PRODUCT_SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <button type="button" className={`tv-btn${arOnly ? ' tv-btn--primary' : ''}`} aria-pressed={arOnly} onClick={() => setArOnly((v) => !v)}>
            AR uyumlu
          </button>
          <button
            type="button"
            className={`tv-btn${inStockOnly ? ' tv-btn--primary' : ''}`}
            aria-pressed={inStockOnly}
            onClick={() => setInStockOnly((v) => !v)}
          >
            Stokta var
          </button>
          {filterActive ? (
            <button type="button" className="tv-btn" onClick={clearFilters}>
              Filtreleri temizle
            </button>
          ) : null}
        </div>
        <p className="tv-muted" style={{ marginTop: 12, marginBottom: 0 }}>
          {visibleProducts.length} / {products.length} ürün
        </p>
      </div>

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="tv-success" role="status">
          {notice} <Link href="/cart">Sepeti aç</Link>
        </p>
      ) : null}

      <h2 className="tv-section-title">Tüm ürünler</h2>
      {visibleProducts.length === 0 ? (
        <p className="tv-muted">Arama kriterlerinize uyan ürün bulunamadı.</p>
      ) : (
        <div className="tv-marketplace-grid">
          {visibleProducts.map((p) => (
            <MarketplaceProductCard
              key={p.id}
              product={p}
              adding={addingId === p.id}
              onAdd={() => void handleAddToCart(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
