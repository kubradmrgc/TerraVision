'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { authService } from '@/services/authService';
import { useAuthSession } from '@/hooks/useAuthSession';

type ThemeMode = 'light' | 'dark';

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
};

type RoleLink = {
  href: string;
  label: string;
  exact?: boolean;
};

type RoleCategory = {
  id: string;
  label: string;
  hint: string;
  links: RoleLink[];
};

const GUEST_MAIN_LINKS: NavLink[] = [
  { href: '/', label: 'Ana sayfa', exact: true },
  { href: '/products', label: 'Ürünler' },
  { href: '/marketplace', label: 'TerraTakas' },
  { href: '/cart', label: 'Sepet' }
];

const CUSTOMER_MAIN_LINKS: NavLink[] = [
  { href: '/', label: 'Ana sayfa', exact: true },
  { href: '/products', label: 'Ürünler' },
  { href: '/marketplace', label: 'TerraTakas' },
  { href: '/cart', label: 'Sepet' },
  { href: '/profile/my-garden', label: 'Bahçem' }
];

const PROFILE_MENU_LINKS: RoleLink[] = [
  { href: '/profile', label: 'Hesabım', exact: true },
  { href: '/profile/account', label: 'Bilgilerim' },
  { href: '/profile/orders', label: 'Siparişlerim' },
  { href: '/profile/my-garden', label: 'Bahçem' },
  { href: '/profile/ar-rooms', label: 'AR Odalarım' },
  { href: '/profile/exchange', label: 'TerraTakas' }
];

const ROLE_CATEGORIES: RoleCategory[] = [
  {
    id: 'customer',
    label: 'Müşteri',
    hint: 'Alışveriş ve AR deneyimi',
    links: [
      { href: '/login', label: 'Giriş', exact: true },
      { href: '/register', label: 'Kayıt ol' }
    ]
  },
  {
    id: 'consultant',
    label: 'Danışman',
    hint: 'Randevu ve danışmanlık paneli',
    links: [{ href: '/login/consultant', label: 'Giriş' }]
  },
  {
    id: 'admin',
    label: 'Yönetici',
    hint: 'Ürün, sipariş ve AR yönetimi',
    links: [
      { href: '/login/admin', label: 'Giriş' },
      { href: '/admin/dashboard', label: 'Panel' },
      { href: '/admin/products/new', label: 'Ürün ekle' },
      { href: '/admin/ar-insights', label: 'AR içgörüleri' },
      { href: '/admin/consultant-performance', label: 'Danışman karnesi' },
      { href: '/admin/orders', label: 'Siparişler' }
    ]
  }
];

function isLinkActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isRoleActive(pathname: string, role: RoleCategory): boolean {
  return role.links.some((link) => isLinkActive(pathname, link.href, link.exact));
}

function isAnyLoginActive(pathname: string): boolean {
  return pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/admin');
}

function isProfileActive(pathname: string): boolean {
  return pathname === '/profile' || pathname.startsWith('/profile/');
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, isAuthenticated, isCustomer, isAdmin, isConsultant } = useAuthSession();
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const mainLinks = useMemo(() => {
    if (ready && isAuthenticated && isCustomer) {
      return CUSTOMER_MAIN_LINKS;
    }
    return GUEST_MAIN_LINKS;
  }, [ready, isAuthenticated, isCustomer]);

  useEffect(() => {
    const saved = (localStorage.getItem('tv-theme') as ThemeMode | null) ?? 'light';
    setTheme(saved);
    document.documentElement.classList.toggle('dark', saved === 'dark');
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [accountOpen]);

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('tv-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const handleLogout = async () => {
    await authService.logout();
    setAccountOpen(false);
    router.push('/');
    router.refresh();
  };

  const showCustomerAccount = ready && isAuthenticated && isCustomer;
  const showStaffShortcuts = ready && isAuthenticated && (isAdmin || isConsultant);

  return (
    <header className="tv-header">
      <div className="tv-header-bar">
        <BrandLogo href="/" size={56} className="tv-brand--header" />

        <button
          type="button"
          className="tv-nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="tv-nav-panel"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Kapat' : 'Menü'}
        </button>

        <div id="tv-nav-panel" className={`tv-header-panel${menuOpen ? ' tv-header-panel--open' : ''}`}>
          <nav className="tv-nav-primary" aria-label="Mağaza">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`tv-nav-link${isLinkActive(pathname, link.href, link.exact) ? ' tv-nav-link--active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="tv-header-actions">
            {showCustomerAccount ? (
              <div
                ref={accountRef}
                className={`tv-login-dropdown${accountOpen ? ' tv-login-dropdown--open' : ''}${isProfileActive(pathname) ? ' tv-login-dropdown--active' : ''}`}
              >
                <button
                  type="button"
                  className="tv-login-trigger"
                  aria-expanded={accountOpen}
                  aria-controls="tv-account-panel"
                  aria-haspopup="true"
                  onClick={() => setAccountOpen((open) => !open)}
                >
                  Hesabım
                  <span className="tv-login-trigger-icon" aria-hidden="true">
                    ▾
                  </span>
                </button>

                <div id="tv-account-panel" className="tv-login-panel tv-account-panel" role="menu">
                  <nav className="tv-account-links" aria-label="Hesap menüsü">
                    {PROFILE_MENU_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        className={`tv-role-link${isLinkActive(pathname, link.href, link.exact) ? ' tv-role-link--active' : ''}`}
                        onClick={() => setAccountOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      className="tv-account-logout"
                      onClick={() => void handleLogout()}
                    >
                      Çıkış yap
                    </button>
                  </nav>
                </div>
              </div>
            ) : (
              <div
                ref={accountRef}
                className={`tv-login-dropdown${accountOpen ? ' tv-login-dropdown--open' : ''}${isAnyLoginActive(pathname) ? ' tv-login-dropdown--active' : ''}`}
              >
                <button
                  type="button"
                  className="tv-login-trigger"
                  aria-expanded={accountOpen}
                  aria-controls="tv-login-panel"
                  aria-haspopup="true"
                  onClick={() => setAccountOpen((open) => !open)}
                >
                  Giriş
                  <span className="tv-login-trigger-icon" aria-hidden="true">
                    ▾
                  </span>
                </button>

                <div id="tv-login-panel" className="tv-login-panel" role="menu">
                  <div className="tv-role-grid">
                    {ROLE_CATEGORIES.map((role) => (
                      <section
                        key={role.id}
                        className={`tv-role-card${isRoleActive(pathname, role) ? ' tv-role-card--active' : ''}`}
                        aria-labelledby={`tv-role-${role.id}`}
                      >
                        <div className="tv-role-card-head">
                          <h2 id={`tv-role-${role.id}`} className="tv-role-card-title">
                            {role.label}
                          </h2>
                          <p className="tv-role-card-hint">{role.hint}</p>
                        </div>
                        <nav className="tv-role-card-links" aria-label={`${role.label} bağlantıları`}>
                          {role.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              role="menuitem"
                              className={`tv-role-link${isLinkActive(pathname, link.href, link.exact) ? ' tv-role-link--active' : ''}`}
                              onClick={() => setAccountOpen(false)}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </nav>
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showStaffShortcuts ? (
              <Link
                href={isAdmin ? '/admin/orders' : '/products'}
                className={`tv-nav-link tv-nav-link--staff${isLinkActive(pathname, isAdmin ? '/admin' : '/products') ? ' tv-nav-link--active' : ''}`}
              >
                {isAdmin ? 'Yönetici paneli' : 'Danışman alanı'}
              </Link>
            ) : null}

            <button type="button" onClick={toggleTheme} className="tv-theme-btn" aria-label="Tema değiştir">
              {theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
