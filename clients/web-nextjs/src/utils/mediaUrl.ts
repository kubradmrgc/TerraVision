import { API_BASE_URL } from '../config/env';

/** Normalize loopback host so Next image config (localhost + 127.0.0.1) stays consistent. */
function normalizeLoopbackUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === '127.0.0.1') {
      parsed.hostname = 'localhost';
      return parsed.toString();
    }
  } catch {
    // keep original
  }
  return url;
}

export function resolveMediaUrl(path: string): string {
  if (!path) {
    return '';
  }
  if (/^https?:\/\//i.test(path)) {
    return normalizeLoopbackUrl(path);
  }
  return `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
