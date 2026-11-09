/** Interface copy for sign-in errors, keyed by Firebase error code. */
export function signInErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Enter an email like name@example.com.';
    case 'auth/network-request-failed':
      return 'Unable to reach the server. Check your connection and try again.';
    case 'taskdone/not-a-link':
      return 'That is not a sign-in link. Copy the whole link from the email and try again.';
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'This sign-in link has expired or was already used. Request a new one.';
    case 'auth/quota-exceeded':
    case 'auth/too-many-requests':
      return 'Too many sign-in emails today. Try again tomorrow, or use a link you already received.';
    case 'auth/operation-not-allowed':
      return 'Email link sign-in is turned off for this project. Turn it on in the Firebase console.';
    default:
      return 'Unable to sign in. Check your connection and try again.';
  }
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
