'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProfileSubnav } from '@/components/profile/ProfileSubnav';
import { useAuthSession } from '@/hooks/useAuthSession';

const PROFILE_SECTIONS = [
  {
    href: '/profile/account',
    title: 'Bilgilerim',
    desc: 'Ad, soyad ve e-posta bilgileriniz.'
  },
  {
    href: '/profile/orders',
    title: 'Siparişlerim',
    desc: 'Aktif ve geçmiş siparişler, geçmiş randevular.'
  },
  {
    href: '/profile/ar-rooms',
    title: 'AR Odalarım',
    desc: 'Mobilde kaydettiğiniz bitki yerleşimleri ve oda önizlemeleri.'
  },
  {
    href: '/profile/exchange',
    title: 'TerraTakas',
    desc: 'Takas ilanlarınız ve gelen teklifler.'
  }
] as const;

export default function ProfileHubPage() {
  const router = useRouter();
  const { ready, isAuthenticated, isCustomer } = useAuthSession();

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isCustomer) {
      router.replace('/products');
    }
  }, [ready, isAuthenticated, isCustomer, router]);

  if (!ready || !isAuthenticated || !isCustomer) {
    return <p className="tv-muted">Profil yükleniyor…</p>;
  }

  return (
    <div>
      <ProfileSubnav />
      <header className="tv-ar-page-header">
        <div>
          <span className="tv-login-pill">Hesabım</span>
          <h1 className="tv-page-title">Hesabım</h1>
          <p className="tv-page-lead">
            Kişisel bilgileriniz, sipariş geçmişiniz, AR odalarınız ve TerraTakas ilanlarınız.
          </p>
        </div>
      </header>
      <div className="tv-profile-hub-grid">
        {PROFILE_SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="tv-profile-hub-card">
            <h2>{section.title}</h2>
            <p>{section.desc}</p>
            <span className="tv-profile-hub-card-cta">Bölüme git →</span>
          </Link>
        ))}
      </div>
      <p className="tv-page-actions tv-muted">
        Bakım takvimi ve bitki asistanı için üst menüdeki{' '}
        <Link href="/profile/my-garden">Bahçem</Link> bağlantısını kullanın.
      </p>
    </div>
  );
}
