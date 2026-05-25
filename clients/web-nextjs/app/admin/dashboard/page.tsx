import Link from 'next/link';
import { AdminInventoryAlertBanner } from '@/components/admin/AdminInventoryAlertBanner';

export default function DashboardPage() {
  return (
    <>
      <AdminInventoryAlertBanner />
      <p className="tv-page-actions tv-admin-breadcrumb" style={{ marginBottom: 12 }}>
        <Link href="/admin/products/new">Yeni ürün ekle</Link>
        <span aria-hidden="true">·</span>
        <Link href="/admin/ar-insights">AR içgörüleri</Link>
        <span aria-hidden="true">·</span>
        <Link href="/admin/orders">Sipariş yönetimi</Link>
        <span aria-hidden="true">·</span>
        <Link href="/admin/consultant-performance">Danışman karnesi</Link>
      </p>
    <section style={{ height: 'calc(100vh - 120px)' }}>      <iframe
        src="/dashboard-stitch.html"
        title="TerraVision Dashboard"
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #e4e4e7',
          borderRadius: 12,
          background: '#fff'
        }}
      />
    </section>
    </>
  );
}