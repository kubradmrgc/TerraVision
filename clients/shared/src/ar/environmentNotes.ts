/** Parses `environmentMetadata` JSON saved by `ArSessionService`. */
export function parseArEnvironmentNotes(metadata: string): string {
  try {
    const parsed = JSON.parse(metadata) as { environmentNotes?: string };
    return parsed.environmentNotes?.trim() || '—';
  } catch {
    return '—';
  }
}

/** Response keys from GET /api/ar/sessions/me — used in contract smoke tests. */
export const AR_SESSION_DTO_KEYS = [
  'id',
  'userId',
  'productId',
  'productName',
  'productImageUrl',
  'deviceModel',
  'screenshotUrl',
  'scaleX',
  'scaleY',
  'scaleZ',
  'rotationY',
  'environmentMetadata',
  'createdDate'
] as const;
