'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArSessionResponseDto } from '@terravision/shared';
import { OptimizedMediaImage } from '@/components/OptimizedMediaImage';
import { arSessionService } from '@/services/arSessionService';
import { authService } from '@/services/authService';
import { tokenStore } from '@/services/tokenStore';

function parseEnvironmentNotes(metadata: string): string {
  try {
    const parsed = JSON.parse(metadata) as { environmentNotes?: string };
    return parsed.environmentNotes?.trim() || '—';
  } catch {
    return '—';
  }
}

export default function ArRoomsProfilePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ArSessionResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tokenStore.getToken()) {
      router.replace('/login');
      return;
    }
    if (!authService.isCustomer()) {
      setError('Bu sayfa yalnızca müşteri hesapları içindir.');
      setLoading(false);
      return;
    }

    setLoading(true);
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
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="tv-muted">Yükleniyor…</p>;
  }

  return (
    <div>
      <h1 className="tv-page-title">AR Odalarım</h1>
      <p className="tv-page-lead">
        Mobil uygulamada kaydettiğiniz bitki yerleşimleri ve oda ekran görüntüleri.
      </p>
      <p className="tv-page-actions">
        <Link href="/products">Ürünlere dön</Link>
      </p>

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      {!error && sessions.length === 0 ? (
        <div className="tv-card tv-card--empty">
          <p>Henüz kayıtlı AR yerleşimi yok. Mobil uygulamada AR deneyiminden sonra &quot;Tasarımı Odama Kaydet&quot; ile ekleyebilirsiniz.</p>
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
              <h2 className="tv-ar-card-title">{session.productName}</h2>
              <p className="tv-muted">
                {new Date(session.createdDate).toLocaleString('tr-TR')} · {session.deviceModel}
              </p>
              <p className="tv-ar-scale">
                Ölçek: X {session.scaleX} · Y {session.scaleY} · Z {session.scaleZ} · Dönüş {session.rotationY}°
              </p>
              <p className="tv-ar-notes">
                <strong>Ortam:</strong> {parseEnvironmentNotes(session.environmentMetadata)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
