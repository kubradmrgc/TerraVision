import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTOMATIC_RECONNECT_DELAYS_MS,
  INITIAL_CONNECT_MAX_ROUNDS,
  delayBeforeConnectRetry
} from '../src/realtime/realtimePolicy.ts';

describe('realtimePolicy', () => {
  it('exposes mobile reconnect delays', () => {
    assert.equal(AUTOMATIC_RECONNECT_DELAYS_MS.length, 8);
    assert.equal(AUTOMATIC_RECONNECT_DELAYS_MS[0], 0);
  });

  it('delayBeforeConnectRetry returns 0 on first round', () => {
    assert.equal(delayBeforeConnectRetry(0), 0);
  });

  it('INITIAL_CONNECT_MAX_ROUNDS matches retry table', () => {
    assert.equal(INITIAL_CONNECT_MAX_ROUNDS, 5);
  });
});
