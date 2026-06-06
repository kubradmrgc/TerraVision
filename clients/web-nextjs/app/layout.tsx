import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { PlantScenery } from './components/PlantScenery';
import { SiteFooterBar } from './components/SiteFooterBar';
import { TopNav } from './components/TopNav';
import { buildRootMetadata } from '@/config/siteSeo';

export const metadata: Metadata = {
  ...buildRootMetadata(),
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
          <SiteFooterBar />
        </div>
      </body>
    </html>
  );
}
