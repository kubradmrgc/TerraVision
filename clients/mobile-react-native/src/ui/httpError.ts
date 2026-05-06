import axios from 'axios';

export function toStatusMessage(
  error: unknown,
  fallback: string,
  map: Partial<Record<number, string>>
): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status && map[status]) {
      return map[status] as string;
    }
  }
  return fallback;
}
