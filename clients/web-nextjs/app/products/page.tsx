'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { formatTryCurrency } from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { productService } from '@/services/productService';
import { cartService } from '@/services/cartService';
import { tokenStore } from '@/services/tokenStore';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import type { ProductDto } from '@/types/product';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!tokenStore.getToken()) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await productService.getProducts();
      setProducts(list);
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
        <p className="tv-page-lead">Bitkileri keşfedin ve sepete ekleyin.</p>
        <p className="tv-page-actions">
          <Link href="/cart">Sepetime git →</Link>
        </p>
      </header>

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

      <ul className="tv-product-grid">
        {products.map((p) => (
          <li key={p.id} className="tv-card tv-product-row">
            <div className="tv-product-row-body">
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
                <p className="tv-product-row-meta">{formatTryCurrency(p.price)}</p>
                {p.isArCompatible ? <span className="tv-badge-ar">AR uyumlu</span> : null}
              </div>
            </div>
            <AddToCartButton
              loading={addingId === p.id}
              onClick={() => void handleAddToCart(p)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
