'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PROFILE_LINKS = [
  { href: '/profile', label: 'Hesabım', exact: true },
  { href: '/profile/account', label: 'Bilgilerim' },
  { href: '/profile/orders', label: 'Siparişlerim' },
  { href: '/profile/ar-rooms', label: 'AR Odalarım' },
  { href: '/profile/exchange', label: 'TerraTakas' },
  { href: '/profile/chat', label: 'Peyzaj Sohbet' }
] as const;

export function ProfileSubnav() {
  const pathname = usePathname();

  return (
    <nav className="tv-profile-subnav" aria-label="Profil bölümleri">
      {PROFILE_LINKS.map((link) => {
        const exact = 'exact' in link && link.exact;
        const active = exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`tv-profile-subnav-link${active ? ' tv-profile-subnav-link--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
