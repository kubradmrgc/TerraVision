'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HomeLoginBlock } from './HomeLoginBlock';
import {
  HOME_CATEGORIES,
  HOME_FAQ,
  HOME_FEATURES,
  HOME_SHOWCASE,
  HOME_STATS,
  STEPS_CUSTOMER,
  STEPS_GUEST
} from '@/config/homeLanding';
import { useAuthSession } from '@/hooks/useAuthSession';

function FeatureIcon({ kind }: { kind: (typeof HOME_FEATURES)[number]['icon'] }) {
  if (kind === 'leaf') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="tv-landing-feature-icon-svg">
        <path
          d="M12 3c-4 4-6 8-6 12a6 6 0 0 0 12 0c0-4-2-8-6-12z"
          fill="currentColor"
          opacity="0.18"
        />
        <path
          d="M12 3c-4 4-6 8-6 12a6 6 0 0 0 12 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === 'cart') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="tv-landing-feature-icon-svg">
        <path
          d="M6 6h15l-1.5 7H8L6 6z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="19" r="1.4" fill="currentColor" />
        <circle cx="17" cy="19" r="1.4" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="tv-landing-feature-icon-svg">
      <rect x="5" y="7" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function HomePageView() {
  const { ready, isAuthenticated, isCustomer } = useAuthSession();
  const loggedInCustomer = ready && isAuthenticated && isCustomer;
  const steps = loggedInCustomer ? STEPS_CUSTOMER : STEPS_GUEST;

  return (
    <div className="tv-landing">
      <section className="tv-landing-hero" aria-labelledby="landing-hero-title">
        <div className="tv-landing-hero-bg" aria-hidden="true" />
        <div className="tv-landing-container tv-landing-hero-grid">
          <div className="tv-landing-hero-copy">
            <span className="tv-landing-eyebrow">TerraVision · Bitki & Bahçe</span>
            <h1 id="landing-hero-title" className="tv-landing-hero-title">
              {loggedInCustomer
                ? 'Tekrar hoş geldiniz'
                : 'Evinize ve bahçenize uygun bitkileri keşfedin'}
            </h1>
            <p className="tv-landing-hero-lead">
              {loggedInCustomer
                ? 'Hesabınızla giriş yaptınız. Ürün kataloğuna, sepete ve profil alanlarınıza devam edin.'
                : 'Profesyonel bitki alışverişi, sepet yönetimi ve sipariş takibi — hepsi tek bir müşteri portalında. Hemen giriş yaparak alışverişe başlayın.'}
            </p>
            <div className="tv-landing-hero-actions">
              {loggedInCustomer ? (
                <>
                  <Link href="/products" className="tv-landing-btn tv-landing-btn--primary">
                    Ürünlere git
                  </Link>
                  <Link href="/profile" className="tv-landing-btn tv-landing-btn--ghost">
                    Profilim
                  </Link>
                  <Link href="/cart" className="tv-landing-btn tv-landing-btn--ghost">
                    Sepetim
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="tv-landing-btn tv-landing-btn--primary">
                    Müşteri girişi
                  </Link>
                  <Link href="/register" className="tv-landing-btn tv-landing-btn--ghost">
                    Hesap oluştur
                  </Link>
                  <Link href="/products" className="tv-landing-btn tv-landing-btn--ghost">
                    Ürünleri incele
                  </Link>
                </>
              )}
            </div>
            <nav className="tv-landing-quick-links" aria-label="Hızlı erişim">
              {HOME_CATEGORIES.map((item) => (
                <Link key={item.href + item.label} href={item.href} className="tv-landing-quick-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <HomeLoginBlock variant="hero" id="giris-ust" />
        </div>
      </section>

      <section className="tv-landing-section tv-landing-stats" aria-label="Platform öne çıkanları">
        <div className="tv-landing-container tv-landing-stats-grid">
          {HOME_STATS.map((item) => (
            <div key={item.label} className="tv-landing-stat">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <p className="tv-landing-stat-hint">{item.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="tv-landing-section" aria-labelledby="landing-features">
        <div className="tv-landing-container">
          <header className="tv-landing-section-head">
            <h2 id="landing-features" className="tv-landing-section-title">
              Neden TerraVision?
            </h2>
            <p className="tv-landing-section-lead">
              Müşteri odaklı platformumuz alışverişten sipariş takibine kadar tüm süreci sadeleştirir.
              Bitki kataloğu, sepet ve AR deneyimini tek yerden yönetin.
            </p>
          </header>
          <div className="tv-landing-features-grid">
            {HOME_FEATURES.map((item) => (
              <article key={item.title} className="tv-landing-feature-card">
                <span className="tv-landing-feature-icon" aria-hidden="true">
                  <FeatureIcon kind={item.icon} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tv-landing-section tv-landing-section--muted" aria-labelledby="landing-showcase">
        <div className="tv-landing-container">
          <header className="tv-landing-section-head">
            <h2 id="landing-showcase" className="tv-landing-section-title">
              Öne çıkan bitkiler
            </h2>
            <p className="tv-landing-section-lead">
              {loggedInCustomer
                ? 'Kataloğa göz atın, sepete ekleyin ve AR uyumlu ürünleri deneyin.'
                : 'Giriş yaptıktan sonra tüm kataloğa, sepete ve AR uyumlu ürünlere erişin.'}
            </p>
          </header>
          <div className="tv-landing-showcase-grid">
            {HOME_SHOWCASE.map((item, index) => (
              <article key={item.name} className="tv-landing-showcase-card">
                <Link href="/products" className="tv-landing-showcase-link">
                  <div className="tv-landing-showcase-media">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="tv-landing-showcase-img"
                      priority={index === 0}
                    />
                    <span className="tv-landing-showcase-tag">{item.tag}</span>
                    <span className="tv-landing-showcase-hover">Kataloğu incele →</span>
                  </div>
                  <h3>{item.name}</h3>
                </Link>
              </article>
            ))}
          </div>
          <div className="tv-landing-section-cta">
            <Link href="/products" className="tv-landing-btn tv-landing-btn--primary">
              Tüm ürünleri gör
            </Link>
          </div>
        </div>
      </section>

      <section className="tv-landing-section" aria-labelledby="landing-steps">
        <div className="tv-landing-container">
          <header className="tv-landing-section-head tv-landing-section-head--center">
            <h2 id="landing-steps" className="tv-landing-section-title">
              Nasıl çalışır?
            </h2>
          </header>
          <ol className="tv-landing-steps">
            {steps.map((item) => (
              <li key={item.step} className="tv-landing-step">
                <span className="tv-landing-step-num">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="tv-landing-section tv-landing-section--faq"
        aria-labelledby="landing-faq"
      >
        <div className="tv-landing-container tv-landing-faq-wrap">
          <header className="tv-landing-section-head tv-landing-section-head--center">
            <h2 id="landing-faq" className="tv-landing-section-title">
              Sık sorulan sorular
            </h2>
            <p className="tv-landing-section-lead">
              Bitki alışverişi, AR önizleme ve TerraTakas hakkında kısa yanıtlar.
            </p>
          </header>
          <div className="tv-landing-faq-list">
            {HOME_FAQ.map((item) => (
              <details key={item.question} className="tv-landing-faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
