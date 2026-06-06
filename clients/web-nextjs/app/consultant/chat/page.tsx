'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ConsultationSessionDto } from '@terravision/shared';
import { chatService } from '@/services/chatService';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getApiErrorMessage } from '@/utils/apiError';

export default function ConsultantChatListPage() {
  const router = useRouter();
  const { ready, isAuthenticated, isConsultant } = useAuthSession();
  const [sessions, setSessions] = useState<ConsultationSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatService.getMySessions();
      setSessions(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sohbetler yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!isAuthenticated) {
      router.replace('/login/consultant');
      return;
    }
    if (!isConsultant) {
      router.replace('/products');
      return;
    }
    void loadSessions();
  }, [ready, isAuthenticated, isConsultant, router, loadSessions]);

  if (!ready || !isAuthenticated || !isConsultant) {
    return <p className="tv-muted">Yükleniyor…</p>;
  }

  return (
    <div>
      <header className="tv-ar-page-header">
        <div>
          <span className="tv-login-pill">Danışman alanı</span>
          <h1 className="tv-page-title">Danışan sohbetleri</h1>
          <p className="tv-page-lead">Danışanlarınızla yazışın ve ürün teklifleri gönderin.</p>
        </div>
      </header>

      {loading ? <p className="tv-muted">Sohbetler yükleniyor…</p> : null}
      {error ? <p className="tv-form-error">{error}</p> : null}

      {!loading && sessions.length === 0 ? (
        <div className="tv-card tv-card--empty">
          <p>Henüz danışan sohbetiniz yok. Müşteriler danışman seçtiğinde oturumlar burada görünür.</p>
        </div>
      ) : null}

      <ul className="tv-profile-hub-grid">
        {sessions.map((session) => (
          <li key={session.id}>
            <Link href={`/consultant/chat/${session.id}`} className="tv-profile-hub-card">
              <h2>{session.title}</h2>
              <p>
                {session.customerName} ·{' '}
                {session.lastMessageAt
                  ? new Date(session.lastMessageAt).toLocaleString('tr-TR')
                  : new Date(session.createdDate).toLocaleString('tr-TR')}
              </p>
              <span className="tv-profile-hub-card-cta">Sohbete git →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
