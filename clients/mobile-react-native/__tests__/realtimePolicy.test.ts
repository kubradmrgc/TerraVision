import {
  AUTOMATIC_RECONNECT_DELAYS_MS,
  INITIAL_CONNECT_MAX_ROUNDS,
  INITIAL_CONNECT_RETRY_DELAYS_MS,
  delayBeforeConnectRetry
} from '../src/services/realtimePolicy';

describe('realtimePolicy', () => {
  it('automatic reconnect has increasing tail for flaky networks', () => {
    expect(AUTOMATIC_RECONNECT_DELAYS_MS.length).toBeGreaterThanOrEqual(5);
    expect(AUTOMATIC_RECONNECT_DELAYS_MS[0]).toBe(0);
    expect(AUTOMATIC_RECONNECT_DELAYS_MS[AUTOMATIC_RECONNECT_DELAYS_MS.length - 1]).toBeGreaterThanOrEqual(60_000);
  });

  it('initial connect max rounds matches retry table', () => {
    expect(INITIAL_CONNECT_MAX_ROUNDS).toBe(1 + INITIAL_CONNECT_RETRY_DELAYS_MS.length);
  });

  it('delayBeforeConnectRetry is zero on first round then maps to retry table', () => {
    expect(delayBeforeConnectRetry(0)).toBe(0);
    expect(delayBeforeConnectRetry(1)).toBe(INITIAL_CONNECT_RETRY_DELAYS_MS[0]);
    expect(delayBeforeConnectRetry(2)).toBe(INITIAL_CONNECT_RETRY_DELAYS_MS[1]);
    const lastIdx = INITIAL_CONNECT_RETRY_DELAYS_MS.length;
    expect(delayBeforeConnectRetry(lastIdx + 2)).toBe(
      INITIAL_CONNECT_RETRY_DELAYS_MS[INITIAL_CONNECT_RETRY_DELAYS_MS.length - 1]
    );
  });
});
