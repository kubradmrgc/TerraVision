import { isAxiosError } from 'axios';
import { AUTH_UI_MESSAGES } from '../auth/session';
import { API_BASE_URL, getApiConnectMode } from '../../config/env';
import { MultipartUploadError } from '../../services/uploadFileHelpers';

function apiUnreachableMessage(): string {
  const mode = getApiConnectMode();
  const modeHint =
    mode === 'usb'
      ? 'USB: kablo takili, `npm run setup:device`, API `dotnet run --launch-profile http`'
      : 'Wi-Fi: telefon ve PC ayni agda, `npm run setup:device`';
  return `API sunucusuna ulasilamiyor (${API_BASE_URL}). PC'de dotnet run --launch-profile http calissin. ${modeHint}`;
}

export const EXCHANGE_UI_MESSAGES = {
  loadFailed: 'TerraTakas ilanları yüklenemedi.',
  offerFailed: 'Teklif gönderilemedi.',
  listingFailed: 'İlan oluşturulamadı.',
  uploadFailed: 'Fotoğraf yüklenemedi.',
  statusFailed: 'Teklif güncellenemedi.',
  sessionExpired: AUTH_UI_MESSAGES.sessionExpired,
  forbidden: 'Bu işlem için giriş yapmanız gerekiyor.',
  serverError: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  get apiUnreachable() {
    return apiUnreachableMessage();
  }
} as const;

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof MultipartUploadError && error.status === 0) {
    return true;
  }
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('network') ||
      msg.includes('ağ') ||
      msg.includes('fetch') ||
      msg.includes('timeout') ||
      msg.includes('failed')
    );
  }
  if (isAxiosError(error) && !error.response) {
    return true;
  }
  return false;
}

export function exchangeErrorForStatus(
  status: number | undefined,
  fallback: string,
  error?: unknown
): string {
  if (error instanceof MultipartUploadError) {
    if (error.status === 401) return EXCHANGE_UI_MESSAGES.sessionExpired;
    if (error.status === 403) return EXCHANGE_UI_MESSAGES.forbidden;
    if (error.status === 500) return EXCHANGE_UI_MESSAGES.serverError;
    if (error.status === 400 && error.message) return error.message;
    if (error.status === 0 && error.message) return error.message;
    if (isNetworkFailure(error)) return apiUnreachableMessage();
    return error.message || fallback;
  }
  if (isNetworkFailure(error)) {
    return apiUnreachableMessage();
  }
  if (error !== undefined && isAxiosError(error)) {
    const data = error.response?.data;
    if (status === 400) {
      if (typeof data === 'string' && data.trim()) return data;
      if (data && typeof data === 'object' && 'message' in data) {
        const msg = (data as { message?: string }).message;
        if (msg?.trim()) return msg;
      }
    }
  }
  if (status === 401) return EXCHANGE_UI_MESSAGES.sessionExpired;
  if (status === 403) return EXCHANGE_UI_MESSAGES.forbidden;
  if (status === 500) return EXCHANGE_UI_MESSAGES.serverError;
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
