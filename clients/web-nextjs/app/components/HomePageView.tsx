'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { HomeLoginBlock } from './HomeLoginBlock';
import { API_BASE_URL } from '@/config/env';
import { useAuthSession } from '@/hooks/useAuthSession';

const SHOWCASE_IMAGES = [
  {
    src: `${API_BASE_URL}/assets/product-images/monstera-deliciosa.jpg`,
    name: 'Monstera Deliciosa',
    tag: 'İç mekan'
  },
  {
    src: `${API_BASE_URL}/assets/product-images/fiddle-leaf-fig.jpg`,
    name: 'Keman Yapraklı İncir',
    tag: 'Popüler'
  },
  {
    src: `${API_BASE_URL}/assets/product-images/lavender-pot.jpg`,
    name: 'Lavanta Saksı',
    tag: 'Bahçe'
  }
] as const;

const FEATURES = [
  {
    title: 'Zengin ürün kataloğu',
    desc: 'İç ve dış mekan bitkileri, saksılar ve bahçe ürünlerini tek platformda keşfedin.'
  },
  {
    title: 'Kolay sepet ve sipariş',
    desc: 'Sepetinizi anında güncelleyin, siparişlerinizi güvenle tamamlayın ve takip edin.'
  },
  {
    title: 'AR ile önizleme',
    desc: 'Uyumlu ürünlerde artırılmış gerçeklik ile bitkileri alanınızda görüntüleyin.'
  }
] as const;

const STEPS_GUEST = [
  { step: '1', title: 'Giriş yapın', desc: 'Müşteri hesabınızla platforma erişin.' },
  { step: '2', title: 'Ürün seçin', desc: 'Kataloğu inceleyin, sepete ekleyin.' },
  { step: '3', title: 'Sipariş verin', desc: 'Ödemenizi tamamlayın ve siparişinizi izleyin.' }
] as const;

const STEPS_CUSTOMER = [
  { step: '1', title: 'Ürün seçin', desc: 'Kataloğu inceleyin, sepete ekleyin.' },
  { step: '2', title: 'Sipariş verin', desc: 'Ödemenizi tamamlayın ve siparişinizi izleyin.' },
  { step: '3', title: 'Profilinizi yönetin', desc: 'AR odaları, bahçe ve TerraTakas alanlarını kullanın.' }
] as const;

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
            {!loggedInCustomer ? (
              <p className="tv-landing-hero-scroll">
                <a href="#giris-alt">Sayfanın altındaki giriş alanına git ↓</a>
              </p>
            ) : null}
          </div>
          <HomeLoginBlock variant="hero" id="giris-ust" />
        </div>
      </section>

      <section className="tv-landing-section tv-landing-stats" aria-label="Öne çıkanlar">
        <div className="tv-landing-container tv-landing-stats-grid">
          <div className="tv-landing-stat">
            <strong>3+</strong>
            <span>Kategori</span>
          </div>
          <div className="tv-landing-stat">
            <strong>AR</strong>
            <span>Ürün önizleme</span>
          </div>
          <div className="tv-landing-stat">
            <strong>7/24</strong>
            <span>Online katalog</span>
          </div>
          <div className="tv-landing-stat">
            <strong>Güvenli</strong>
            <span>Sipariş takibi</span>
          </div>
        </div>
      </section>

      <section className="tv-landing-section" aria-labelledby="landing-features">
        <div className="tv-landing-container">
          <header className="tv-landing-section-head">
            <h2 id="landing-features" className="tv-landing-section-title">
              Neden TerraVision?
            </h2>
            <p className="tv-landing-section-lead">
              Müşteri odaklı platformumuz alışverişten sipariş takibine kadar tüm süreci
              sadeleştirir.
            </p>
          </header>
          <div className="tv-landing-features-grid">
            {FEATURES.map((item) => (
              <article key={item.title} className="tv-landing-feature-card">
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
              Öne çıkan ürünler
            </h2>
            <p className="tv-landing-section-lead">
              {loggedInCustomer
                ? 'Kataloğa göz atın, sepete ekleyin ve AR uyumlu ürünleri deneyin.'
                : 'Giriş yaptıktan sonra tüm kataloğa, sepete ve AR uyumlu ürünlere erişin.'}
            </p>
          </header>
          <div className="tv-landing-showcase-grid">
            {SHOWCASE_IMAGES.map((item) => (
              <article key={item.name} className="tv-landing-showcase-card">
                <div className="tv-landing-showcase-media">
                  <Image
                    src={item.src}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="tv-landing-showcase-img"
                  />
                  <span className="tv-landing-showcase-tag">{item.tag}</span>
                </div>
                <h3>{item.name}</h3>
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

      {!loggedInCustomer ? (
        <section className="tv-landing-section tv-landing-bottom-login" aria-labelledby="landing-bottom-login">
          <div className="tv-landing-container">
            <header className="tv-landing-section-head tv-landing-section-head--center">
              <h2 id="landing-bottom-login" className="tv-landing-section-title">
                Hazır mısınız? Giriş yapın
              </h2>
              <p className="tv-landing-section-lead">
                Üstteki giriş kartına ulaşamadıysanız aşağıdaki alandan müşteri hesabınızla devam
                edebilirsiniz. Personel girişleri üst menüdeki <strong>Giriş</strong> menüsündedir.
              </p>
            </header>
            <div className="tv-landing-bottom-login-wrap">
              <HomeLoginBlock variant="footer" id="giris-alt" />
            </div>
            <p className="tv-landing-back-top">
              <a href="#giris-ust">↑ Üst giriş alanına dön</a>
            </p>
          </div>
        </section>
      ) : null}

      <footer className="tv-landing-footer">
        <div className="tv-landing-container tv-landing-footer-inner">
          <div className="tv-landing-footer-brand">
            <BrandLogo size={56} className="tv-brand--header" />
            <p className="tv-landing-footer-tagline">Bitki ve bahçe alışveriş platformu</p>
          </div>
          <p className="tv-landing-footer-copy">
            © {new Date().getFullYear()} TerraVision. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
