import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from './components/TopNav';

export const metadata: Metadata = {
  title: 'TerraVision',
  description: 'TerraVision Web Client'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <TopNav />
        <main className="tv-main">{children}</main>
      </body>
    </html>
  );
}
