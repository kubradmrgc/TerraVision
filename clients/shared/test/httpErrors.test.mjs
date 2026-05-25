import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toStatusMessage } from '../src/http/errors.ts';

describe('toStatusMessage', () => {
  it('maps known http status to custom message', () => {
    const error = { isAxiosError: true, response: { status: 413 } };
    const message = toStatusMessage(error, 'fallback', { 413: 'Dosya cok buyuk.' });
    assert.equal(message, 'Dosya cok buyuk.');
  });

  it('returns fallback for unknown errors', () => {
    const message = toStatusMessage(new Error('boom'), 'fallback', { 400: 'bad request' });
    assert.equal(message, 'fallback');
  });
});
