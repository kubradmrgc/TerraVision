import { ORDER_STATUS_LABELS, getOrderStatusLabel as sharedGetOrderStatusLabel } from '@terravision/shared';
import { MobilePalette, MobileSection } from '../features/app/types';

export const orderStatusLabels = ORDER_STATUS_LABELS;

export const sectionLabels: Record<MobileSection, string> = {
  products: 'Products',
  cart: 'Cart',
  orders: 'Orders',
  appointments: 'Appointments',
  events: 'Events'
};

export const sectionIcons: Record<MobileSection, string> = {
  products: '🧩',
  cart: '🛒',
  orders: '📦',
  appointments: '🗓️',
  events: '⚡'
};

export const getOrderStatusLabel = sharedGetOrderStatusLabel;

export const getPalette = (themeMode: 'light' | 'dark'): MobilePalette =>
  themeMode === 'dark'
    ? {
        /* Stitch product dashboard dark */
        bg: '#051426',
        card: '#122033',
        text: '#d5e3fd',
        subText: '#bdcabe',
        border: '#889489',
        button: '#86efac',
        buttonText: '#00391d',
        header: '#1c2b3e',
        mutedCard: '#0d1c2f',
        brandTitle: '#dbffe2',
        outlineVariant: '#3e4a40',
        surfaceDim: '#051426',
        secondaryContainer: '#404758',
        onSecondaryContainer: '#aeb5c9',
        primaryContainer: '#86efac',
        onPrimaryContainer: '#006d3e',
        bottomNav: '#0d1c2f',
        navInactive: '#889489',
        imagePlaceholder: '#273649',
        elevatedSurface: '#1c2b3e',
        surfaceLowest: '#010f21',
        stockPillBg: 'rgba(134, 239, 172, 0.22)',
        stockPillBorder: '#86efac',
        stockPillText: '#73db9a',
        stockLowPillBg: 'rgba(255, 180, 171, 0.18)',
        stockLowPillBorder: '#ffb4ab',
        stockLowPillText: '#ffb4ab',
        arPillBg: 'rgba(134, 239, 172, 0.15)',
        arPillBorder: '#86efac',
        arPillText: '#dbffe2',
        productCtaBg: '#010f21',
        productCtaFg: '#d5e3fd',
        productCtaBorder: '#3e4a40',
        productUseOutlineAddToCart: true,
        realtimeCapsuleBg: '#1c2b3e',
        realtimeCapsuleBorder: '#3e4a40',
        realtimeCapsuleLabelColor: '#86efac',
        realtimeCapsuleDotColor: '#86efac'
      }
    : {
        bg: '#fbf8fc',
        card: '#ffffff',
        text: '#1b1b1e',
        subText: '#404940',
        border: '#bfc9bd',
        button: '#004c22',
        buttonText: '#ffffff',
        header: '#fbf8fc',
        mutedCard: '#f6f2f7',
        brandTitle: '#004c22',
        outlineVariant: '#bfc9bd',
        surfaceDim: '#dcd9dd',
        secondaryContainer: '#8cf5b2',
        onSecondaryContainer: '#007241',
        primaryContainer: '#166534',
        onPrimaryContainer: '#93e0a2',
        bottomNav: '#f0edf1',
        navInactive: '#404940',
        imagePlaceholder: '#e4e1e6',
        elevatedSurface: '#ffffff',
        surfaceLowest: '#ffffff',
        stockPillBg: '#166534',
        stockPillBorder: '#166534',
        stockPillText: '#93e0a2',
        stockLowPillBg: '#fef2f2',
        stockLowPillBorder: '#fecaca',
        stockLowPillText: '#b91c1c',
        arPillBg: '#8cf5b2',
        arPillBorder: '#8cf5b2',
        arPillText: '#007241',
        productCtaBg: '#004c22',
        productCtaFg: '#ffffff',
        productCtaBorder: '#004c22',
        productUseOutlineAddToCart: false,
        realtimeCapsuleBg: '#8cf5b2',
        realtimeCapsuleBorder: '#8cf5b2',
        realtimeCapsuleLabelColor: '#007241',
        realtimeCapsuleDotColor: '#007241'
      };
