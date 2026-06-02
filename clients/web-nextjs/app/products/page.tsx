'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  PRODUCT_SORT_OPTIONS,
  ProductSortKey,
  filterAndSortProducts,
  formatTryCurrency,
  isProductFilterActive
} from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { productService } from '@/services/productService';
import { categoryService, type CategoryDto } from '@/services/categoryService';
import { cartService } from '@/services/cartService';
import { tokenStore } from '@/services/tokenStore';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import type { ProductDto } from '@/types/product';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductDto[]>([]);
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
    if (!tokenStore.getToken()) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [list, cats] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories().catch(() => [] as CategoryDto[])
      ]);
      setProducts(list);
      setCategories(cats);
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        setError('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
        router.replace('/login');
      } else if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('Bu sayfayı görüntüleme yetkiniz bulunmuyor.');
      } else {
        setError(getApiErrorMessage(err, 'Ürünler yüklenemedi. Lütfen tekrar deneyin.'));
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const filter = useMemo(
    () => ({ search, categoryId, arOnly, inStockOnly, sort }),
    [search, categoryId, arOnly, inStockOnly, sort]
  );

  const visibleProducts = useMemo(() => filterAndSortProducts(products, filter), [products, filter]);
  const filterActive = isProductFilterActive(filter);

  const clearFilters = () => {
    setSearch('');
    setCategoryId(null);
    setArOnly(false);
    setInStockOnly(false);
    setSort('relevance');
  };

  const handleAddToCart = async (product: ProductDto) => {
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
        router.replace('/login');
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
        <p className="tv-page-lead">Bitkileri keşfedin, arayın ve sepete ekleyin.</p>
        <p className="tv-page-actions">
          <Link href="/cart">Sepetime git →</Link>
        </p>
      </header>

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
          <button
            type="button"
            className={`tv-btn${arOnly ? ' tv-btn--primary' : ''}`}
            aria-pressed={arOnly}
            onClick={() => setArOnly((v) => !v)}
          >
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
          {visibleProducts.length} / {products.length} ürün gösteriliyor
        </p>
      </div>

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="tv-success" role="status">
          {notice}{' '}
          <Link href="/cart">Sepeti aç</Link>
        </p>
      ) : null}

      {visibleProducts.length === 0 ? (
        <p className="tv-muted">Arama kriterlerinize uyan ürün bulunamadı.</p>
      ) : (
        <ul className="tv-product-grid">
          {visibleProducts.map((p) => (
            <li key={p.id} className="tv-card tv-product-row">
              <Link
                href={`/products/${p.id}`}
                className="tv-product-row-body"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {p.imageUrl ? (
                  <OptimizedMediaImage
                    src={p.imageUrl}
                    alt={p.name}
                    width={72}
                    height={72}
                    sizes="72px"
                    style={{
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid var(--tv-border)'
                    }}
                  />
                ) : null}
                <div>
                  <p className="tv-product-row-title">{p.name}</p>
                  <p className="tv-product-row-meta">
                    {formatTryCurrency(p.price)}
                    {p.stockQuantity <= 0 ? ' · Tükendi' : null}
                  </p>
                  {p.isArCompatible ? <span className="tv-badge-ar">AR uyumlu</span> : null}
                </div>
              </Link>
              <AddToCartButton
                loading={addingId === p.id}
                disabled={p.stockQuantity <= 0}
                onClick={() => void handleAddToCart(p)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
