import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdminInventoryAlertBanner } from './AdminInventoryAlertBanner';

type Props = {
  title: string;
  lead: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function AdminPageShell({ title, lead, children, actions }: Props) {
  return (
    <div className="tv-admin-page">
      <header className="tv-admin-header">
        <span className="tv-login-pill">Yönetici</span>
        <h1 className="tv-page-title">{title}</h1>
        <p className="tv-page-lead">{lead}</p>
        <nav className="tv-page-actions tv-admin-breadcrumb" aria-label="Admin gezinti">
          <Link href="/admin/dashboard">Dashboard</Link>
          <span aria-hidden="true">·</span>
          <Link href="/admin/orders">Siparişler</Link>
          <span aria-hidden="true">·</span>
          <Link href="/admin/ar-insights">AR içgörüleri</Link>
          <span aria-hidden="true">·</span>
          <Link href="/admin/consultant-performance">Danışman karnesi</Link>
          <span aria-hidden="true">·</span>
          <Link href="/products">Mağaza ürünleri</Link>
          {actions ? (
            <>
              <span aria-hidden="true">·</span>
              {actions}
            </>
          ) : null}
        </nav>
      </header>
      <AdminInventoryAlertBanner />
      {children}
    </div>
  );
}
