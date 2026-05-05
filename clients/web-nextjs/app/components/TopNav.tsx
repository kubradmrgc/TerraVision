'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

export function TopNav() {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const saved = (localStorage.getItem('tv-theme') as ThemeMode | null) ?? 'light';
    setTheme(saved);
    document.documentElement.classList.toggle('dark', saved === 'dark');
  }, []);

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('tv-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <header className="tv-header">
      <strong>TerraVision</strong>
      <nav className="tv-nav">
        <Link href="/">Ana</Link>
        <Link href="/login">Giriş</Link>
        <Link href="/products">Ürünler</Link>
        <Link href="/cart">Sepet</Link>
        <Link href="/admin/dashboard">Dashboard</Link>
        <Link href="/admin/orders">Admin Sipariş</Link>
      </nav>
      <button type="button" onClick={toggleTheme} className="tv-theme-btn">
        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>
    </header>
  );
}
