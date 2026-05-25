/**
 * SignalR automatic reconnect delays (ms) after the connection drops.
 * Longer tail handles flaky mobile networks without hammering the server.
 */
export const AUTOMATIC_RECONNECT_DELAYS_MS = [
  0, 2_000, 5_000, 10_000, 20_000, 30_000, 60_000, 60_000
] as const;

/**
 * Pauses before each *full* connect retry (WebSocket + LongPolling both failed).
 * Indexed by attempt index after the first full failure.
 */
export const INITIAL_CONNECT_RETRY_DELAYS_MS = [1_500, 4_000, 8_000, 15_000] as const;

/** Max rounds = 1 initial try + retries after INITIAL_CONNECT_RETRY_DELAYS_MS entries that we use. */
export const INITIAL_CONNECT_MAX_ROUNDS = 1 + INITIAL_CONNECT_RETRY_DELAYS_MS.length;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function delayBeforeConnectRetry(roundIndex: number): number {
  if (roundIndex <= 0) {
    return 0;
  }
  const idx = roundIndex - 1;
  return INITIAL_CONNECT_RETRY_DELAYS_MS[
    Math.min(idx, INITIAL_CONNECT_RETRY_DELAYS_MS.length - 1)
  ];
}
