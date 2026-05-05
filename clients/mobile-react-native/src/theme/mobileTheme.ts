import { MobilePalette, MobileSection } from '../features/app/types';

export const orderStatusLabels: Record<number, string> = {
  1: 'Pending',
  2: 'Confirmed',
  3: 'Shipped',
  4: 'Delivered',
  5: 'Cancelled'
};

export const sectionLabels: Record<MobileSection, string> = {
  products: 'Products',
  cart: 'Cart',
  orders: 'Orders',
  events: 'Events'
};

export const sectionIcons: Record<MobileSection, string> = {
  products: '🧩',
  cart: '🛒',
  orders: '📦',
  events: '⚡'
};

export const getOrderStatusLabel = (status: number): string =>
  orderStatusLabels[status] ?? `Unknown(${status})`;

export const getPalette = (themeMode: 'light' | 'dark'): MobilePalette =>
  themeMode === 'dark'
    ? {
        bg: '#0f172a',
        card: '#111827',
        text: '#e2e8f0',
        subText: '#94a3b8',
        border: '#334155',
        button: '#86efac',
        buttonText: '#14532d',
        header: '#111827',
        mutedCard: '#0b1220'
      }
    : {
        bg: '#f4f4f5',
        card: '#ffffff',
        text: '#18181b',
        subText: '#52525b',
        border: '#e4e4e7',
        button: '#166534',
        buttonText: '#ffffff',
        header: '#ffffff',
        mutedCard: '#fafafa'
      };
