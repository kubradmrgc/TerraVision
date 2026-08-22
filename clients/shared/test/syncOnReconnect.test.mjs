import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  REALTIME_RECONNECT_QUERY_KEYS,
  syncQueriesOnReconnect
} from '../src/realtime/syncOnReconnect.ts';

describe('syncOnReconnect', () => {
  it('defines commerce query keys to refresh', () => {
    assert.deepEqual(REALTIME_RECONNECT_QUERY_KEYS, [
      ['cart'],
      ['orders'],
      ['products'],
      ['appointments'],
      ['care']
    ]);
  });

  it('invalidates each key on reconnect', async () => {
    const calls = [];
    await syncQueriesOnReconnect((filters) => {
      calls.push(filters.queryKey);
    });
    assert.equal(calls.length, 5);
    assert.deepEqual(calls[0], ['cart']);
    assert.deepEqual(calls[4], ['care']);
  });
});
