'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ChatConsultantDto, ConsultationSessionDto } from '@terravision/shared';
import { ProfileSubnav } from '@/components/profile/ProfileSubnav';
import { chatService } from '@/services/chatService';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getApiErrorMessage } from '@/utils/apiError';

const PEYZAJ_CONSULTANT_IDS = [4, 5, 6];

export default function ProfileChatListPage() {
  const router = useRouter();
  const { ready, isAuthenticated, isCustomer, isConsultant } = useAuthSession();
  const [sessions, setSessions] = useState<ConsultationSessionDto[]>([]);
  const [consultants, setConsultants] = useState<ChatConsultantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionData = await chatService.getMySessions();
      setSessions(sessionData);
      if (isCustomer) {
        const consultantData = await chatService.getConsultants();
        setConsultants(consultantData.filter((c) => PEYZAJ_CONSULTANT_IDS.includes(c.id)));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sohbetler yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (isConsultant) {
      router.replace('/consultant/chat');
      return;
    }
    if (!isCustomer) {
      router.replace('/products');
      return;
    }
    void loadData();
  }, [ready, isAuthenticated, isCustomer, isConsultant, router, loadData]);

  const handleStartChat = async (consultant: ChatConsultantDto) => {
    const existing = sessions.find((s) => s.consultantId === consultant.id && s.status === 1);
    if (existing) {
      router.push(`/profile/chat/${existing.id}`);
      return;
    }

    setStartingId(consultant.id);
    setError(null);
    try {
      const session = await chatService.createSession({
        consultantId: consultant.id,
        title: `Peyzaj planı — ${consultant.displayName}`
      });
      router.push(`/profile/chat/${session.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sohbet başlatılamadı.'));
    } finally {
      setStartingId(null);
    }
  };

  if (!ready || !isAuthenticated || !isCustomer) {
    return <p className="tv-muted">Yükleniyor…</p>;
  }

  return (
    <div>
      <ProfileSubnav />
      <header className="tv-ar-page-header">
        <div>
          <span className="tv-login-pill">Peyzaj danışmanlığı</span>
          <h1 className="tv-page-title">Sohbetlerim</h1>
          <p className="tv-page-lead">Danışmanınızı seçin veya mevcut sohbetinize devam edin.</p>
        </div>
      </header>

      {loading ? <p className="tv-muted">Yükleniyor…</p> : null}
      {error ? <p className="tv-form-error">{error}</p> : null}

      <section className="tv-chat-consultant-section">
        <h2 className="tv-section-title">Danışman seçin</h2>
        <ul className="tv-profile-hub-grid">
          {consultants.map((consultant) => (
            <li key={consultant.id}>
              <button
                type="button"
                className="tv-profile-hub-card tv-profile-hub-card--button"
                disabled={startingId === consultant.id}
                onClick={() => void handleStartChat(consultant)}
              >
                <h2>{consultant.displayName}</h2>
                <p>{consultant.email}</p>
                <span className="tv-profile-hub-card-cta">
                  {startingId === consultant.id ? 'Başlatılıyor…' : 'Sohbet başlat →'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="tv-section-title">Sohbetlerim</h2>
        {!loading && sessions.length === 0 ? (
          <div className="tv-card tv-card--empty">
            <p>Henüz sohbet oturumunuz yok. Yukarıdan bir danışman seçerek başlayın.</p>
          </div>
        ) : null}
        <ul className="tv-profile-hub-grid">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link href={`/profile/chat/${session.id}`} className="tv-profile-hub-card">
                <h2>{session.title}</h2>
                <p>
                  {session.consultantName} ile ·{' '}
                  {session.lastMessageAt
                    ? new Date(session.lastMessageAt).toLocaleString('tr-TR')
                    : new Date(session.createdDate).toLocaleString('tr-TR')}
                </p>
                <span className="tv-profile-hub-card-cta">Sohbete git →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
