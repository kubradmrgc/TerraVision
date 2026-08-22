import axios from 'axios';

type ApiErrorBody = {
  message?: string;
  Message?: string;
  errors?: unknown;
  Errors?: unknown;
};

export function isNetworkError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    !error.response &&
    (error.code === 'ERR_NETWORK' || error.message.toLowerCase().includes('network'))
  );
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (isNetworkError(error)) {
    return 'API sunucusuna bağlanılamıyor. TerraVision.Api çalışıyor mu? (http://localhost:5090)';
  }

  const data = error.response?.data;
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object') {
    const body = data as ApiErrorBody;
    const message = body.message ?? body.Message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    const validation = (data as { errors?: Record<string, string[]> }).errors;
    if (validation && typeof validation === 'object') {
      const messages = Object.values(validation).flat().filter((m) => typeof m === 'string' && m.trim());
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
  }

  if (error.response?.status === 403) {
    return 'Bu işlem için yetkiniz bulunmuyor.';
  }

  if (error.response?.status === 401) {
    return 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.';
  }

  if (error.response?.status === 413) {
    return 'Dosya boyutu sunucu limitini aşıyor (en fazla 5 MB).';
  }

  return fallback;
}

export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
