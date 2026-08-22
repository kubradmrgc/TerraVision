import { API_BASE_URL, getArModelBaseUrl } from '../../config/env';
import { ArPreviewResponse } from '../../types/ar';

const LAN_HOST_PATTERN =
  /^(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i;

export function isDevReachableModelUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    return LAN_HOST_PATTERN.test(parsed.hostname);
  } catch {
    return false;
  }
}

/** Rewrites API-relative or localhost model paths so the device can fetch the file. */
export function resolveArModelUrl(modelUrl: string): string {
  const trimmed = modelUrl.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${API_BASE_URL.replace(/\/$/, '')}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const api = new URL(getArModelBaseUrl());
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return `${api.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

export function withResolvedModelUrl(preview: ArPreviewResponse): ArPreviewResponse {
  return {
    ...preview,
    modelUrl: resolveArModelUrl(preview.modelUrl)
  };
}
