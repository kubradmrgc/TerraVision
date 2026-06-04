'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProfileSubnav } from '@/components/profile/ProfileSubnav';
import { authService } from '@/services/authService';
import { tokenStore } from '@/services/tokenStore';
import { useAuthSession } from '@/hooks/useAuthSession';

export default function ProfileAccountPage() {
  const router = useRouter();
  const { ready, isAuthenticated, isCustomer } = useAuthSession();
  const profile = ready ? authService.getProfile() : null;

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isCustomer) {
      router.replace('/products');
    }
  }, [ready, isAuthenticated, isCustomer, router]);

  if (!ready || !isAuthenticated || !isCustomer || !profile) {
    return <p className="tv-muted">Bilgiler yükleniyor…</p>;
  }

  return (
    <div>
      <ProfileSubnav />
      <header className="tv-ar-page-header">
        <div>
          <span className="tv-login-pill">Hesabım</span>
          <h1 className="tv-page-title">Bilgilerim</h1>
          <p className="tv-page-lead">Ad, soyad ve e-posta bilgileriniz.</p>
        </div>
      </header>

      <section className="tv-card">
        <dl className="tv-profile-dl">
          <div>
            <dt>Ad</dt>
            <dd>{profile.firstName || '—'}</dd>
          </div>
          <div>
            <dt>Soyad</dt>
            <dd>{profile.lastName || '—'}</dd>
          </div>
          <div>
            <dt>E-posta</dt>
            <dd>{profile.email}</dd>
          </div>
        </dl>
      </section>

      <p className="tv-page-actions">
        <Link href="/profile/orders">Siparişlerim →</Link>
        {' · '}
        <Link href="/profile">Hesabım özeti</Link>
      </p>
    </div>
  );
}
