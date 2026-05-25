type AxiosLikeError = {
  isAxiosError?: boolean;
  response?: { status?: number };
};

function isAxiosLikeError(error: unknown): error is AxiosLikeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosLikeError).isAxiosError === true
  );
}

export function toStatusMessage(
  error: unknown,
  fallback: string,
  map: Partial<Record<number, string>>
): string {
  if (isAxiosLikeError(error)) {
    const status = error.response?.status;
    if (status !== undefined && map[status]) {
      return map[status] as string;
    }
  }
  return fallback;
}
