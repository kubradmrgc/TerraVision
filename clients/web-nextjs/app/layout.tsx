import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from './components/TopNav';

export const metadata: Metadata = {
  title: 'TerraVision',
  description: 'Bitki ve bahçe platformu — müşteri alışverişi ve yönetici operasyonları',
  icons: {
    icon: '/brand/terravision-logo.png',
    apple: '/brand/terravision-logo.png'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <TopNav />
        <main className="tv-main tv-main--site">{children}</main>
      </body>
    </html>
  );
}
