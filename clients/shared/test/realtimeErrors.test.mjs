import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isRealtimeUnauthorizedError } from '../src/realtime/realtimeErrors.ts';

describe('isRealtimeUnauthorizedError', () => {
  it('detects negotiate 401 errors', () => {
    const err = new Error("Unauthorized: Status code '401'");
    assert.equal(isRealtimeUnauthorizedError(err), true);
  });

  it('ignores unrelated errors', () => {
    assert.equal(isRealtimeUnauthorizedError(new Error('Network down')), false);
  });
});
