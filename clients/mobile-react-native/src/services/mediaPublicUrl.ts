import { API_BASE_URL } from '../config/env';

/** Local API returns `/assets/...` when PublicBaseUrl is unset — mobile needs an absolute URL. */
export function resolveMediaPublicUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  return trimmed.startsWith('/') ? `${base}${trimmed}` : `${base}/${trimmed}`;
}
