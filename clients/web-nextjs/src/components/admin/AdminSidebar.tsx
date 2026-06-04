'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authService } from '@/services/authService';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/admin/orders', label: 'Siparişler', icon: '◎' },
  { href: '/admin/campaigns', label: 'Kampanyalar', icon: '◇' },
  { href: '/admin/products/new', label: 'Ürün ekle', icon: '＋' },
  { href: '/admin/users', label: 'Kullanıcılar', icon: '○' },
  { href: '/admin/ar-insights', label: 'AR içgörüleri', icon: '▣' },
  { href: '/admin/consultant-performance', label: 'Danışman karnesi', icon: '◆' }
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin/dashboard') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="tv-admin-sidebar" aria-label="Yönetici menüsü">
      <div className="tv-admin-sidebar-brand">
        <span className="tv-admin-sidebar-logo" aria-hidden="true">
          TV
        </span>
        <div>
          <strong className="tv-admin-sidebar-title">TerraVision</strong>
          <span className="tv-admin-sidebar-sub">Yönetim paneli</span>
        </div>
      </div>

      <nav className="tv-admin-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`tv-admin-sidebar-link${isActive(pathname, item.href) ? ' tv-admin-sidebar-link--active' : ''}`}
            aria-current={isActive(pathname, item.href) ? 'page' : undefined}
          >
            <span className="tv-admin-sidebar-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="tv-admin-sidebar-foot">
        <Link href="/products" className="tv-admin-sidebar-link tv-admin-sidebar-link--muted">
          Mağazayı önizle
        </Link>
        <button
          type="button"
          className="tv-admin-sidebar-link tv-admin-sidebar-link--muted tv-admin-sidebar-logout"
          onClick={() => void authService.logout().then(() => window.location.assign('/login/admin'))}
        >
          Çıkış yap
        </button>
      </div>
    </aside>
  );
}
