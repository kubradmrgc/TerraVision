import { AUTH_UI_MESSAGES } from '../auth/session';

export const EXCHANGE_UI_MESSAGES = {
  loadFailed: 'TerraTakas ilanları yüklenemedi.',
  offerFailed: 'Teklif gönderilemedi.',
  listingFailed: 'İlan oluşturulamadı.',
  uploadFailed: 'Fotoğraf yüklenemedi.',
  statusFailed: 'Teklif güncellenemedi.',
  sessionExpired: AUTH_UI_MESSAGES.sessionExpired,
  forbidden: 'Bu işlem için giriş yapmanız gerekiyor.',
  serverError: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.'
} as const;

export function exchangeErrorForStatus(status: number | undefined, fallback: string): string {
  if (status === 401) return EXCHANGE_UI_MESSAGES.sessionExpired;
  if (status === 403) return EXCHANGE_UI_MESSAGES.forbidden;
  if (status === 500) return EXCHANGE_UI_MESSAGES.serverError;
  return fallback;
}
