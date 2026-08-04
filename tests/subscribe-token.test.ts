import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createConfirmToken, verifyConfirmToken } from '../lib/subscribe-token.ts';

describe('subscribe confirm tokens', () => {
  const prevKey = process.env.RESEND_API_KEY;
  const prevSecret = process.env.SUBSCRIBE_SECRET;

  before(() => {
    process.env.SUBSCRIBE_SECRET = 'test-secret-for-hmac-tokens';
    delete process.env.RESEND_API_KEY;
  });

  after(() => {
    if (prevKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prevKey;
    if (prevSecret === undefined) delete process.env.SUBSCRIBE_SECRET;
    else process.env.SUBSCRIBE_SECRET = prevSecret;
  });

  it('round-trips a valid token', () => {
    const token = createConfirmToken('You@Example.COM');
    const result = verifyConfirmToken(token);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.email, 'you@example.com');
  });

  it('rejects tampered tokens', () => {
    const token = createConfirmToken('a@b.co');
    const [payload, sig] = token.split('.');
    const bad = `${payload}.${sig?.slice(0, -2)}xx`;
    assert.equal(verifyConfirmToken(bad).ok, false);
  });

  it('rejects expired tokens', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = createConfirmToken('a@b.co', now - 50 * 60 * 60); // issued in the past so exp is past
    // Token TTL is 48h from issue; issue at now-50h means exp = now-2h → expired
    const result = verifyConfirmToken(token, now);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, 'expired');
  });
});
