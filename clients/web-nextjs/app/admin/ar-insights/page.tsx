'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArSessionResponseDto, parseArEnvironmentNotes } from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { arSessionService } from '@/services/arSessionService';
import { authService } from '@/services/authService';
import { realtimeService } from '@/services/realtimeService';
import { tokenStore } from '@/services/tokenStore';

export default function AdminArInsightsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ArSessionResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = tokenStore.getToken();
    if (!token) {
      router.replace('/login/admin');
      return;
    }
    if (!authService.isAdmin()) {
      setError('Bu panel yalnızca yöneticiler içindir.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await arSessionService.getAllSessions();
      setSessions(list);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        tokenStore.clearTokens();
        router.replace('/login/admin');
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('AR içgörülerine erişim yetkiniz yok.');
      } else {
        setError('AR oturumları yüklenemedi.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!authService.isAdmin() || !tokenStore.getToken()) {
      return;
    }

    void realtimeService.connect();
    const unsubscribe = realtimeService.onArSessionCreated((event) => {
      setLiveNotice(`Yeni AR denemesi: ${event.productName} (${event.customerEmail})`);
      void load();
    });
    const unsubReconnect = realtimeService.onReconnected(() => {
      void load();
    });

    return () => {
      unsubscribe();
      unsubReconnect();
      void realtimeService.disconnect();
    };
  }, [load]);

  const productStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of sessions) {
      map.set(session.productName, (map.get(session.productName) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [sessions]);

  if (loading) {
    return <p className="tv-muted">Yükleniyor…</p>;
  }

  return (
    <div>
      <h1 className="tv-page-title">AR İçgörüleri</h1>
      <p className="tv-page-lead">
        Müşterilerin mobil AR denemeleri, yerleşim ölçekleri ve oda ekran görüntüleri.
      </p>
      <p className="tv-page-actions">
        <Link href="/admin/orders">Sipariş yönetimi</Link>
        {' · '}
        <Link href="/admin/consultant-performance">Danışman karnesi</Link>
        {' · '}
        <Link href="/admin/dashboard">Dashboard</Link>
      </p>

      {liveNotice ? (
        <p className="tv-success" role="status">
          {liveNotice}
        </p>
      ) : null}

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      {!error && productStats.length > 0 ? (
        <section className="tv-card tv-ar-stats">
          <h2 className="tv-section-title">En çok denenen bitkiler</h2>
          <ul className="tv-ar-stats-list">
            {productStats.map(([name, count]) => (
              <li key={name}>
                <span>{name}</span>
                <strong>{count} deneme</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!error && sessions.length === 0 ? (
        <div className="tv-card tv-card--empty">
          <p>Henüz kayıtlı AR oturumu yok.</p>
        </div>
      ) : null}

      <div className="tv-ar-grid">
        {sessions.map((session) => (
          <article key={session.id} className="tv-card tv-ar-card">
            <OptimizedMediaImage
              src={session.screenshotUrl}
              alt={`${session.productName} AR`}
              width={800}
              height={600}
              className="tv-ar-shot"
              sizes="(max-width: 768px) 100vw, 280px"
            />
            <div className="tv-ar-card-body">
              <h2 className="tv-ar-card-title">{session.productName}</h2>
              <p className="tv-muted">
                {session.customerName ?? 'Müşteri'} · {session.customerEmail ?? '—'}
              </p>
              <p className="tv-muted">{new Date(session.createdDate).toLocaleString('tr-TR')}</p>
              <p className="tv-ar-scale">
                Ölçek X/Y/Z: {session.scaleX} / {session.scaleY} / {session.scaleZ}
              </p>
              <p className="tv-ar-notes">{parseArEnvironmentNotes(session.environmentMetadata)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
