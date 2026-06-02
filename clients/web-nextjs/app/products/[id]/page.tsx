'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { formatTryCurrency } from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { productService } from '@/services/productService';
import { categoryService, type CategoryDto } from '@/services/categoryService';
import { cartService } from '@/services/cartService';
import { tokenStore } from '@/services/tokenStore';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import type { ProductDto } from '@/types/product';

function careRows(product: ProductDto): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (product.wateringIntervalDays) {
    rows.push({ label: 'Sulama', value: `${product.wateringIntervalDays} günde bir` });
  }
  if (product.fertilizingIntervalDays) {
    rows.push({ label: 'Gübreleme', value: `${product.fertilizingIntervalDays} günde bir` });
  }
  if (product.cleaningIntervalDays) {
    rows.push({ label: 'Temizlik', value: `${product.cleaningIntervalDays} günde bir` });
  }
  return rows;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!tokenStore.getToken()) {
      router.replace('/login');
      return;
    }
    if (!Number.isFinite(productId)) {
      setError('Geçersiz ürün.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const item = await productService.getProduct(productId);
      setProduct(item);
      try {
        const cats = await categoryService.getCategories();
        setCategoryName(cats.find((c: CategoryDto) => c.id === item.categoryId)?.name ?? null);
      } catch {
        setCategoryName(null);
      }
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('Ürün bulunamadı.');
      } else {
        setError(getApiErrorMessage(err, 'Ürün yüklenemedi. Lütfen tekrar deneyin.'));
      }
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }
    setAdding(true);
    setError(null);
    setNotice(null);
    try {
      await cartService.addItem(product.id, 1);
      setNotice(`${product.name} sepete eklendi.`);
    } catch (err) {
      if (isUnauthorized(err)) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(err, 'Sepete eklenemedi. Lütfen tekrar deneyin.'));
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <p className="tv-muted">Yükleniyor…</p>;
  }

  if (!product) {
    return (
      <div>
        <p className="tv-error" role="alert">
          {error ?? 'Ürün bulunamadı.'}
        </p>
        <Link href="/products">← Mağazaya dön</Link>
      </div>
    );
  }

  const inStock = product.stockQuantity > 0;
  const lowStock = inStock && product.stockQuantity <= Math.max(product.minStockLevel, 5);
  const care = careRows(product);

  return (
    <div>
      <p className="tv-page-actions">
        <Link href="/products">← Ürünler</Link>
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 280px', minWidth: 240 }}>
          {product.imageUrl ? (
            <OptimizedMediaImage
              src={product.imageUrl}
              alt={product.name}
              width={420}
              height={320}
              sizes="(max-width: 600px) 100vw, 420px"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
                borderRadius: 12,
                border: '1px solid var(--tv-border)'
              }}
            />
          ) : (
            <div
              className="tv-card"
              style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span className="tv-muted">Görsel yok</span>
            </div>
          )}
        </div>

        <div style={{ flex: '1 1 320px', minWidth: 260 }}>
          <span className="tv-login-pill">{categoryName ?? 'Mağaza'}</span>
          <h1 className="tv-page-title">{product.name}</h1>
          <p className="tv-page-title" style={{ fontSize: 24, marginTop: 4 }}>
            {formatTryCurrency(product.price)}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0 16px' }}>
            <span
              className="tv-badge-ar"
              style={
                inStock
                  ? undefined
                  : { background: 'var(--tv-bg-elevated)', color: 'var(--tv-text-muted)' }
              }
            >
              {inStock ? (lowStock ? `Son ${product.stockQuantity} adet` : 'Stokta var') : 'Tükendi'}
            </span>
            {product.isArCompatible ? <span className="tv-badge-ar">AR uyumlu</span> : null}
            <span className="tv-muted">SKU: {product.sku}</span>
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

          <AddToCartButton loading={adding} disabled={!inStock} onClick={() => void handleAddToCart()} />
        </div>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2 className="tv-section-title">Açıklama</h2>
        <p>{product.description?.trim() ? product.description : 'Açıklama eklenmemiş.'}</p>
      </section>

      {care.length > 0 || product.careInstructions?.trim() ? (
        <section style={{ marginTop: 24 }}>
          <h2 className="tv-section-title">Bakım bilgileri</h2>
          {care.length > 0 ? (
            <ul className="tv-muted" style={{ margin: '8px 0', paddingLeft: 18 }}>
              {care.map((row) => (
                <li key={row.label}>
                  <strong>{row.label}:</strong> {row.value}
                </li>
              ))}
            </ul>
          ) : null}
          {product.careInstructions?.trim() ? <p>{product.careInstructions}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
