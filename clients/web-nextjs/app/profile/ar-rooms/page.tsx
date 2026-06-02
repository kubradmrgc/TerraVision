'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArSessionResponseDto, parseArEnvironmentNotes } from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { ProfileSubnav } from '@/components/profile/ProfileSubnav';
import { arSessionService } from '@/services/arSessionService';
import { authService } from '@/services/authService';
import { tokenStore } from '@/services/tokenStore';

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function ArRoomsProfilePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ArSessionResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!tokenStore.getToken()) {
      router.replace('/login');
      return;
    }
    if (!authService.isCustomer()) {
      setError('Bu sayfa yalnızca müşteri hesapları içindir.');
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const list = await arSessionService.getMySessions();
      setSessions(list);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        tokenStore.clearTokens();
        router.replace('/login');
        return;
      }
      setError('AR odası kayıtları yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const productSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of sessions) {
      map.set(session.productName, (map.get(session.productName) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [sessions]);

  if (loading) {
    return (
      <div>
        <ProfileSubnav />
        <p className="tv-muted">AR odalarınız yükleniyor…</p>
      </div>
    );
  }

  return (
    <div>
      <ProfileSubnav />
      <header className="tv-ar-page-header">
        <div>
          <h1 className="tv-page-title">AR Odalarım</h1>
          <p className="tv-page-lead">
            Mobil uygulamada kaydettiğiniz bitki yerleşimleri ve oda ekran görüntüleri.
          </p>
        </div>
        <button
          type="button"
          className="tv-btn-secondary tv-btn--compact"
          disabled={refreshing}
          onClick={() => void load(true)}
        >
          {refreshing ? 'Yenileniyor…' : 'Yenile'}
        </button>
      </header>

      {!error && sessions.length > 0 ? (
        <section className="tv-card tv-ar-summary" aria-label="Özet">
          <p className="tv-ar-summary-count">
            <strong>{sessions.length}</strong> kayıtlı yerleşim
          </p>
          {productSummary.length > 0 ? (
            <ul className="tv-ar-stats-list">
              {productSummary.map(([name, count]) => (
                <li key={name}>
                  <span>{name}</span>
                  <strong>{count} kayıt</strong>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <p className="tv-page-actions">
        <Link href="/products">Ürünlere dön</Link>
        {' · '}
        <Link href="/profile/my-garden">Bahçem</Link>
      </p>

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      {!error && sessions.length === 0 ? (
        <div className="tv-card tv-card--empty">
          <p>Henüz kayıtlı AR yerleşimi yok.</p>
          <p className="tv-muted">
            Mobil uygulamada AR deneyiminden sonra &quot;Tasarımı Odama Kaydet&quot; ile ekleyebilirsiniz.
          </p>
          <p className="tv-page-actions" style={{ marginTop: 12 }}>
            <Link href="/products">AR uyumlu ürünlere git</Link>
          </p>
        </div>
      ) : null}

      <div className="tv-ar-grid">
        {sessions.map((session) => (
          <article key={session.id} className="tv-card tv-ar-card">
            <OptimizedMediaImage
              src={session.screenshotUrl}
              alt={`${session.productName} AR yerleşimi`}
              width={800}
              height={600}
              className="tv-ar-shot"
              sizes="(max-width: 768px) 100vw, 280px"
            />
            <div className="tv-ar-card-body">
              <div className="tv-ar-card-head">
                {session.productImageUrl ? (
                  <OptimizedMediaImage
                    src={session.productImageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="tv-ar-product-thumb"
                    sizes="48px"
                  />
                ) : null}
                <h2 className="tv-ar-card-title">{session.productName}</h2>
              </div>
              <p className="tv-muted">
                {formatSessionDate(session.createdDate)} · {session.deviceModel}
              </p>
              <p className="tv-ar-scale">
                Ölçek: X {session.scaleX} · Y {session.scaleY} · Z {session.scaleZ} · Dönüş {session.rotationY}°
              </p>
              <p className="tv-ar-notes">
                <strong>Ortam:</strong> {parseArEnvironmentNotes(session.environmentMetadata)}
              </p>
              <p className="tv-ar-card-actions">
                <Link href="/products">Ürünü tekrar gör</Link>
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
