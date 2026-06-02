'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProfileSubnav } from '@/components/profile/ProfileSubnav';
import { useAuthSession } from '@/hooks/useAuthSession';

const PROFILE_SECTIONS = [
  {
    href: '/profile/ar-rooms',
    title: 'AR Odalarım',
    desc: 'Mobilde kaydettiğiniz bitki yerleşimleri ve oda önizlemeleri.'
  },
  {
    href: '/profile/my-garden',
    title: 'Bahçem',
    desc: 'Satın aldığınız bitkiler ve bakım hatırlatıcıları.'
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
          <h1 className="tv-page-title">Profilim</h1>
          <p className="tv-page-lead">
            AR odalarınız, bahçe kayıtlarınız ve TerraTakas ilanlarınız tek yerden erişilebilir.
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
    </div>
  );
}
