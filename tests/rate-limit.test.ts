import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from '../lib/rate-limit.ts';

describe('checkRateLimit', () => {
  it('allows up to max requests within the window', () => {
    const ns = `test-allow-${Date.now()}`;
    const key = '1.2.3.4';
    const opts = { windowMs: 60_000, max: 3 };

    assert.equal(checkRateLimit(ns, key, opts).ok, true);
    assert.equal(checkRateLimit(ns, key, opts).ok, true);
    assert.equal(checkRateLimit(ns, key, opts).ok, true);
    const blocked = checkRateLimit(ns, key, opts);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.ok(blocked.retryAfterSec >= 1);
    }
  });

  it('tracks keys independently', () => {
    const ns = `test-keys-${Date.now()}`;
    const opts = { windowMs: 60_000, max: 1 };
    assert.equal(checkRateLimit(ns, 'a', opts).ok, true);
    assert.equal(checkRateLimit(ns, 'b', opts).ok, true);
    assert.equal(checkRateLimit(ns, 'a', opts).ok, false);
  });
});
