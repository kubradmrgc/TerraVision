'use client';

import Link from 'next/link';
import { WEB_LOGIN_PANELS } from '@/config/loginPanels';
import { useAuthSession } from '@/hooks/useAuthSession';

type Props = {
  variant: 'hero' | 'footer';
  id?: string;
};

export function HomeLoginBlock({ variant, id }: Props) {
  const customer = WEB_LOGIN_PANELS.customer;
  const isFooter = variant === 'footer';
  const { ready, isAuthenticated, isCustomer } = useAuthSession();

  if (!ready) {
    return (
      <aside
        id={id}
        className={`tv-home-login tv-home-login--${variant}`}
        aria-label={isFooter ? 'Alt giriş alanı' : 'Giriş alanı'}
        aria-busy="true"
      />
    );
  }

  if (isAuthenticated && isCustomer) {
    return (
      <aside
        id={id}
        className={`tv-home-login tv-home-login--${variant} tv-home-login--authenticated`}
        aria-label="Hesap özeti"
      >
        <div className="tv-home-login-card">
          <span className="tv-home-login-pill">Hoş geldiniz</span>
          <h2 className="tv-home-login-title">Hesabınızla giriş yaptınız</h2>
          <p className="tv-home-login-desc">
            Ürün kataloğuna, sepete ve profil alanlarınıza hemen devam edebilirsiniz.
          </p>
          <ul className="tv-home-login-features">
            <li>Ürün kataloğu ve sepet</li>
            <li>AR odaları ve bahçe kayıtları</li>
            <li>TerraTakas ilanları</li>
          </ul>
          <Link href="/products" className="tv-home-login-btn">
            Alışverişe devam et
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/profile" className="tv-home-login-btn tv-home-login-btn--secondary">
            Profilime git
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside
      id={id}
      className={`tv-home-login tv-home-login--${variant}`}
      aria-label={isFooter ? 'Alt giriş alanı' : 'Giriş alanı'}
    >
      <div className="tv-home-login-card">
        <span className="tv-home-login-pill">{customer.pill}</span>
        <h2 className="tv-home-login-title">{customer.title}</h2>
        <p className="tv-home-login-desc">{customer.subtitle}</p>
        <ul className="tv-home-login-features">
          {customer.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <Link href={customer.loginHref} className="tv-home-login-btn">
          Giriş yap ve alışverişe başla
          <span aria-hidden="true">→</span>
        </Link>
        <Link href="/register" className="tv-home-login-btn tv-home-login-btn--secondary">
          Yeni hesap oluştur
        </Link>
        <p className="tv-home-login-hint">
          Kayıt olduktan sonra web ve mobilde aynı hesapla giriş yapabilirsiniz. Danışman ve yönetici
          girişi için üst menüdeki <strong>Giriş</strong> alanını kullanın.
        </p>
      </div>
    </aside>
  );
}
