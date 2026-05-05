'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { productService } from '@/services/productService';
import { cartService } from '@/services/cartService';
import { tokenStore } from '@/services/tokenStore';
import type { ProductDto } from '@/types/product';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        tokenStore.clearTokens();
        setError('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
        router.replace('/login');
      } else if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('Bu sayfayı görüntüleme yetkiniz bulunmuyor.');
      } else {
        setError('Ürünler yüklenemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddToCart = async (productId: number) => {
    setAddingId(productId);
    try {
      await cartService.addItem(productId, 1);
      router.push('/cart');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        tokenStore.clearTokens();
        setError('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
        router.replace('/login');
      } else if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError('Sepete ekleme isteği geçersiz. Adet veya ürün bilgisini kontrol edin.');
      } else if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('Ürün bulunamadı veya kaldırılmış olabilir.');
      } else {
        setError('Sepete eklenemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return <p>Yükleniyor…</p>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Ürünler</h1>
      <p style={{ marginBottom: 16, color: '#52525b' }}>
        <Link href="/cart">Sepete git</Link>
      </p>
      {error && <p style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</p>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {products.map((p) => (
          <li
            key={p.id}
            style={{
              background: '#fff',
              border: '1px solid #e4e4e7',
              borderRadius: 10,
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div>
              <strong>{p.name}</strong>
              <div style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>
                {p.price} TL · {p.isArCompatible ? 'AR uyumlu' : 'AR bekliyor'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleAddToCart(p.id)}
              disabled={addingId === p.id}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: addingId === p.id ? '#86efac' : '#166534',
                color: '#fff',
                fontWeight: 600
              }}
            >
              {addingId === p.id ? 'Ekleniyor…' : 'Sepete ekle'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
