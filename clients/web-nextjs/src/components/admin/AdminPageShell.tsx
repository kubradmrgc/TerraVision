import type { ReactNode } from 'react';
import { AdminInventoryAlertBanner } from './AdminInventoryAlertBanner';

type Props = {
  title: string;
  lead?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function AdminPageShell({ title, lead, children, actions }: Props) {
  return (
    <div className="tv-admin-page">
      <header className="tv-admin-page-header">
        <div>
          <h1 className="tv-admin-page-title">{title}</h1>
          {lead ? <p className="tv-admin-page-lead">{lead}</p> : null}
        </div>
        {actions ? <div className="tv-admin-page-actions">{actions}</div> : null}
      </header>
      <AdminInventoryAlertBanner />
      <div className="tv-admin-content">{children}</div>
    </div>
  );
}
