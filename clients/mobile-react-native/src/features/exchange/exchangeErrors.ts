import { isAxiosError } from 'axios';
import { AUTH_UI_MESSAGES } from '../auth/session';

export const EXCHANGE_UI_MESSAGES = {
  loadFailed: 'TerraTakas ilanları yüklenemedi.',
  offerFailed: 'Teklif gönderilemedi.',
  listingFailed: 'İlan oluşturulamadı.',
  uploadFailed: 'Fotoğraf yüklenemedi.',
  statusFailed: 'Teklif güncellenemedi.',
  sessionExpired: AUTH_UI_MESSAGES.sessionExpired,
  forbidden: 'Bu işlem için giriş yapmanız gerekiyor.',
  serverError: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  apiUnreachable:
    'API sunucusuna ulaşılamıyor. Bilgisayarda proje kökünden `dotnet run` çalıştırın (http://localhost:5090). Android emülatörü 10.0.2.2 kullanır; fiziksel telefonda PC IP adresini ayarlayın.'
} as const;

export function exchangeErrorForStatus(
  status: number | undefined,
  fallback: string,
  error?: unknown
): string {
  if (error !== undefined && isAxiosError(error) && !error.response) {
    return EXCHANGE_UI_MESSAGES.apiUnreachable;
  }
  if (status === 401) return EXCHANGE_UI_MESSAGES.sessionExpired;
  if (status === 403) return EXCHANGE_UI_MESSAGES.forbidden;
  if (status === 500) return EXCHANGE_UI_MESSAGES.serverError;
  return fallback;
}
