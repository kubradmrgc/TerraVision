'use client';

import Link from 'next/link';
import { AdminPageShell } from '@/components/admin/AdminPageShell';

const QUICK_STATS = [
  { label: 'Sipariş onayı', desc: 'Bekleyen siparişleri onaylayın', href: '/admin/orders' },
  { label: 'Kampanya vitrini', desc: 'İndirim ve banner yönetimi', href: '/admin/campaigns' },
  { label: 'Katalog', desc: 'Yeni ürün ve stok', href: '/admin/products/new' },
  { label: 'Kullanıcılar', desc: 'Rol ve hesap listesi', href: '/admin/users' },
  { label: 'Destek & geri bildirim', desc: 'E-postalar ve site sorunları', href: '/admin/site-feedback' }
] as const;

export default function DashboardPage() {
  return (
    <AdminPageShell
      title="Operasyon özeti"
      lead="Satış, envanter ve müşteri deneyimi metriklerini tek ekrandan izleyin."
    >
      <div className="tv-admin-stat-row">
        {QUICK_STATS.map((item) => (
          <Link key={item.href} href={item.href} className="tv-admin-stat-card">
            <span className="tv-admin-stat-label">{item.label}</span>
            <span className="tv-admin-stat-desc">{item.desc}</span>
          </Link>
        ))}
      </div>

      <section className="tv-card tv-admin-dashboard-frame" aria-label="Dashboard önizleme">
        <iframe
          src="/dashboard-stitch.html"
          title="TerraVision Dashboard"
          className="tv-admin-dashboard-iframe"
        />
      </section>
    </AdminPageShell>
  );
}
