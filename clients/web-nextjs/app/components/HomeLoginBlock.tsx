import Link from 'next/link';
import { WEB_LOGIN_PANELS } from '@/config/loginPanels';

type Props = {
  variant: 'hero' | 'footer';
  id?: string;
};

export function HomeLoginBlock({ variant, id }: Props) {
  const customer = WEB_LOGIN_PANELS.customer;
  const isFooter = variant === 'footer';

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
