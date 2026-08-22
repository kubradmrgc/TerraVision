'use client';

import type { ReactNode } from 'react';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { AdminSidebar } from './AdminSidebar';

type Props = {
  children: ReactNode;
};

export function AdminLayout({ children }: Props) {
  const { status, deniedMessage } = useAdminGuard();

  if (status === 'loading') {
    return (
      <div className="tv-admin-layout-root">
        <AdminSidebar />
        <main className="tv-admin-main">
          <p className="tv-muted">Yönetici oturumu doğrulanıyor…</p>
        </main>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="tv-admin-layout-root">
        <AdminSidebar />
        <main className="tv-admin-main">
          <div className="tv-card tv-admin-denied">
            <h1 className="tv-page-title">Erişim reddedildi</h1>
            <p className="tv-error" role="alert">
              {deniedMessage}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="tv-admin-layout-root">
      <AdminSidebar />
      <main className="tv-admin-main">{children}</main>
    </div>
  );
}
