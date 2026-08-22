import type { MobileSection } from '../features/app/types';

/** Mobil arayüz metinleri (web ile uyumlu Türkçe). */
export const sectionLabels: Record<MobileSection, string> = {
  products: 'Ürünler',
  ar: 'AR',
  cart: 'Sepet',
  orders: 'Siparişler',
  appointments: 'Randevular',
  care: 'Bahçem',
  exchange: 'TerraTakas',
  chat: 'Peyzaj Sohbet',
  events: 'Olaylar',
  profile: 'Profil'
};

export const ORDER_STATUS_LABELS_TR: Record<number, string> = {
  1: 'Beklemede',
  2: 'Onaylandı',
  3: 'Kargoda',
  4: 'Teslim edildi',
  5: 'İptal'
};

export function getOrderStatusLabelTr(status: number): string {
  return ORDER_STATUS_LABELS_TR[status] ?? `Bilinmeyen (${status})`;
}

export function formatRelativeTimeTr(iso?: string): string {
  if (!iso?.trim()) return 'Az önce';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'Yakın zamanda';
  const diffMs = Date.now() - t;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'Az önce';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const d = Math.floor(hr / 24);
  return `${d} gün önce`;
}

export const careStrings = {
  hubTitle: 'Bahçem',
  hubSubtitle: 'Bakım asistanı ve sulama takviminiz',
  tabAssistant: 'Asistan',
  tabCalendar: 'Takvim'
} as const;

export function formatRelativeSinceTr(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'yakın zamanda';
  const diffMs = Date.now() - t;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}
