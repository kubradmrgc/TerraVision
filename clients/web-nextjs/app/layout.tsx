import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'TerraVision',
  description: 'TerraVision Web Client'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <header
          style={{
            background: '#fff',
            borderBottom: '1px solid #e4e4e7',
            padding: '12px 20px',
            display: 'flex',
            gap: '20px',
            alignItems: 'center'
          }}
        >
          <strong>TerraVision</strong>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/">Ana</Link>
            <Link href="/login">Giriş</Link>
            <Link href="/products">Ürünler</Link>
            <Link href="/cart">Sepet</Link>
            <Link href="/admin/orders">Admin Sipariş</Link>
          </nav>
        </header>
        <main style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>{children}</main>
      </body>
    </html>
  );
}
