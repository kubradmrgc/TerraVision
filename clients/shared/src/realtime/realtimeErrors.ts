export function isRealtimeUnauthorizedError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === 'string'
        ? error
        : String(error);

  return /401/.test(message) || /Unauthorized/i.test(message);
}
