function decodeBase64ToUtf8(base64: string): string {
  const globalRef = globalThis as typeof globalThis & {
    atob?: (data: string) => string;
    Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } };
  };

  if (typeof globalRef.atob === 'function') {
    return globalRef.atob(base64);
  }

  if (globalRef.Buffer) {
    return globalRef.Buffer.from(base64, 'base64').toString('utf8');
  }

  throw new Error('Base64 decode is unavailable in this runtime.');
}

/** Returns true when the JWT `exp` claim is in the past (with optional skew). */
export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return true;
    }

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const payload = JSON.parse(decodeBase64ToUtf8(padded)) as { exp?: unknown };
    if (typeof payload.exp !== 'number') {
      return false;
    }

    return Date.now() >= (payload.exp - skewSeconds) * 1000;
  } catch {
    return true;
  }
}
