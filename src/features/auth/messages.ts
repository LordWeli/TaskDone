/** Shortest password accepted when creating an account. */
export const PASSWORD_MIN = 8;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthField = 'email' | 'password' | 'form';

/** Interface copy for auth errors, keyed by Firebase error code, and the field it belongs to. */
export function authErrorMessage(error: unknown): { field: AuthField; text: string } {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  switch (code) {
    case 'auth/invalid-email':
      return { field: 'email', text: 'Enter an email like name@example.com.' };
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return {
        field: 'password',
        text: 'Email or password is incorrect. Try again, or reset your password.',
      };
    case 'auth/email-already-in-use':
      return {
        field: 'email',
        text: 'An account with this email already exists. Sign in instead.',
      };
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return { field: 'password', text: `Use at least ${PASSWORD_MIN} characters.` };
    case 'auth/too-many-requests':
      return {
        field: 'form',
        text: 'Too many attempts. Wait a few minutes, or reset your password.',
      };
    case 'auth/network-request-failed':
      return {
        field: 'form',
        text: 'Unable to reach the server. Check your connection and try again.',
      };
    case 'auth/operation-not-allowed':
      return {
        field: 'form',
        text: 'Email and password sign-in is turned off for this project. Turn it on in the Firebase console.',
      };
    default:
      return { field: 'form', text: 'Unable to sign in. Check your connection and try again.' };
  }
}
