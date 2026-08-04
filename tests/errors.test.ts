import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PublicError, publicErrorMessage } from '../lib/errors.ts';

describe('publicErrorMessage', () => {
  it('hides raw Error messages', () => {
    assert.equal(
      publicErrorMessage(new Error('RESEND_API_KEY leaked')),
      'Something went wrong. Please try again later.',
    );
  });

  it('surfaces PublicError messages', () => {
    assert.equal(publicErrorMessage(new PublicError('Name is required')), 'Name is required');
  });
});
