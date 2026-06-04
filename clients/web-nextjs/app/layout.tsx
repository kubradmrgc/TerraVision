import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { PlantScenery } from './components/PlantScenery';
import { TopNav } from './components/TopNav';

export const metadata: Metadata = {
  title: 'TerraVision',
  description: 'Bitki ve bahçe platformu — müşteri alışverişi ve yönetici operasyonları',
  icons: {
    icon: '/brand/terravision-logo.png',
    apple: '/brand/terravision-logo.png'
  }
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('tv-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <Script id="tv-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <PlantScenery />
        <div className="tv-app-shell">
          <TopNav />
          <main className="tv-main tv-main--site">{children}</main>
        </div>
      </body>
    </html>
  );
}
