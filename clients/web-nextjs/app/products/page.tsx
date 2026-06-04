'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  PRODUCT_SORT_OPTIONS,
  ProductSortKey,
  dealBadgeLabel,
  filterAndSortProducts,
  formatTryCurrency,
  isProductFilterActive,
  type StorefrontDto
} from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { campaignService } from '@/services/campaignService';
import { productService } from '@/services/productService';
import { categoryService, type CategoryDto } from '@/services/categoryService';
import { useAuthSession } from '@/hooks/useAuthSession';
import { cartService } from '@/services/cartService';
import { tokenStore } from '@/services/tokenStore';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import type { ProductDto } from '@/types/product';

function MarketplaceCard({
  product,
  onAdd
}: {
  product: ProductDto;
  onAdd: () => void;
}): React.JSX.Element {
  const badge = dealBadgeLabel(product);
  const inStock = product.stockQuantity > 0;

  return (
    <li className="tv-card tv-marketplace-card">
      <Link href={`/products/${product.id}`} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="tv-marketplace-image-wrap">
          {badge ? <span className="tv-marketplace-discount-badge">{badge}</span> : null}
          {product.imageUrl ? (
            <OptimizedMediaImage
              src={product.imageUrl}
              alt={product.name}
              width={320}
              height={320}
              sizes="(max-width: 600px) 50vw, 200px"
              className="tv-marketplace-card-image"
            />
          ) : (
            <div className="tv-marketplace-card-image" style={{ display: 'grid', placeItems: 'center' }}>
              <span className="tv-muted">Görsel yok</span>
            </div>
          )}
        </div>
        <div className="tv-marketplace-card-body">
          <p className="tv-marketplace-card-title">{product.name}</p>
          <div className="tv-marketplace-price-row">
            <span className="tv-marketplace-price">{formatTryCurrency(product.price)}</span>
            {product.compareAtPrice != null && product.compareAtPrice > product.price ? (
              <span className="tv-marketplace-compare">{formatTryCurrency(product.compareAtPrice)}</span>
            ) : null}
          </div>
          {!inStock ? <span className="tv-muted">Tükendi</span> : null}
        </div>
      </Link>
      <div style={{ padding: '0 12px 12px' }}>
        <AddToCartButton loading={false} disabled={!inStock} onClick={onAdd} />
      </div>
    </li>
  );
}

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
            {storefront!.campaigns.map((c) => (
              <article key={c.id} className="tv-storefront-campaign-card">
                {c.badgeText ? <span className="tv-badge-ar" style={{ marginBottom: 8 }}>{c.badgeText}</span> : null}
                <h3>{c.title}</h3>
                {c.subtitle ? <p>{c.subtitle}</p> : null}
                <p style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>{c.productIds.length} ürün</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {dealProducts.length > 0 ? (
        <section aria-label="İndirimli fırsatlar" style={{ marginBottom: 8 }}>
          <h2 className="tv-section-title">İndirimli fırsatlar</h2>
          <div className="tv-storefront-deals">
            {dealProducts.map((p) => (
              <div key={p.id} style={{ flex: '0 0 180px' }}>
                <MarketplaceCard product={p} onAdd={() => void handleAddToCart(p)} />
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
        <ul className="tv-marketplace-grid">
          {visibleProducts.map((p) => (
            <MarketplaceCard key={p.id} product={p} onAdd={() => void handleAddToCart(p)} />
          ))}
        </ul>
      )}
    </div>
  );
}
