import { EMAIL_PATTERN, authErrorMessage } from './messages';

describe('authErrorMessage', () => {
  it('ties wrong credentials to the password field with a way out', () => {
    expect(authErrorMessage({ code: 'auth/invalid-credential' })).toEqual({
      field: 'password',
      text: expect.stringMatching(/reset your password/),
    });
  });

  it('points an existing account to sign in', () => {
    expect(authErrorMessage({ code: 'auth/email-already-in-use' }).text).toMatch(/Sign in/);
  });

  it('falls back to a recoverable form message', () => {
    expect(authErrorMessage(new Error('boom'))).toEqual({
      field: 'form',
      text: expect.stringMatching(/try again/),
    });
  });
});

describe('EMAIL_PATTERN', () => {
  it('accepts a normal address and rejects junk', () => {
    expect(EMAIL_PATTERN.test('wesley@example.com')).toBe(true);
    expect(EMAIL_PATTERN.test('wesley@')).toBe(false);
  });
});
