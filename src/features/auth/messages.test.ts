import { EMAIL_PATTERN, signInErrorMessage } from './messages';

describe('signInErrorMessage', () => {
  it('says how to recover for known codes', () => {
    expect(signInErrorMessage({ code: 'auth/expired-action-code' })).toMatch(/Request a new one/);
    expect(signInErrorMessage({ code: 'auth/network-request-failed' })).toMatch(/connection/);
  });

  it('falls back to a recoverable message', () => {
    expect(signInErrorMessage(new Error('boom'))).toMatch(/try again/);
  });
});

describe('EMAIL_PATTERN', () => {
  it('accepts a normal address and rejects junk', () => {
    expect(EMAIL_PATTERN.test('wesley@example.com')).toBe(true);
    expect(EMAIL_PATTERN.test('wesley@')).toBe(false);
  });
});
