import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, esc, isHoneypotTripped, isValidEmail } from '../lib/email.ts';

describe('isValidEmail', () => {
  it('accepts common addresses', () => {
    assert.equal(isValidEmail('you@example.com'), true);
    assert.equal(isValidEmail('a.b+tag@domain.co'), true);
  });

  it('rejects invalid shapes', () => {
    assert.equal(isValidEmail(''), false);
    assert.equal(isValidEmail('not-an-email'), false);
    assert.equal(isValidEmail('@missing.local'), false);
    assert.equal(isValidEmail('a@b'), false);
  });
});

describe('esc', () => {
  it('escapes HTML special characters', () => {
    assert.equal(esc(`<script>"x"&'y'</script>`), '&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;');
  });
});

describe('isHoneypotTripped', () => {
  it('trips when bait fields are filled', () => {
    assert.equal(isHoneypotTripped({ website: 'http://spam' }), true);
    assert.equal(isHoneypotTripped({ _gotcha: 'bot' }), true);
    assert.equal(isHoneypotTripped({ email: 'a@b.com' }), false);
    assert.equal(isHoneypotTripped({ website: '   ' }), false);
  });
});

describe('clamp', () => {
  it('trims and truncates', () => {
    assert.equal(clamp('  hello  ', 4), 'hell');
    assert.equal(clamp(null, 10), '');
    assert.equal(clamp(undefined, 10), '');
  });
});
