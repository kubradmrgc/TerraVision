import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isJwtExpired } from '../src/http/jwt.ts';

function makeToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('isJwtExpired', () => {
  it('returns false for a future exp', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    assert.equal(isJwtExpired(token), false);
  });

  it('returns true for a past exp', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
    assert.equal(isJwtExpired(token), true);
  });
});
