import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from './LoginScreen';

function setup(mode: 'request' | 'confirm' = 'request') {
  const onRequest = vi.fn(() => Promise.resolve());
  const onConfirm = vi.fn(() => Promise.resolve());
  const onPasteLink = vi.fn<(email: string, link: string) => Promise<void>>(() =>
    Promise.resolve(),
  );
  render(
    <LoginScreen
      mode={mode}
      onRequest={onRequest}
      onConfirm={onConfirm}
      onPasteLink={onPasteLink}
    />,
  );
  return {
    user: userEvent.setup(),
    onRequest,
    onConfirm,
    onPasteLink,
    input: screen.getByLabelText('Email'),
  };
}

describe('LoginScreen', () => {
  it('sends a link and says where it went', async () => {
    const { user, input, onRequest } = setup();
    await user.type(input, 'me@example.com{Enter}');
    expect(onRequest).toHaveBeenCalledWith('me@example.com');
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByText('me@example.com')).toBeInTheDocument();
  });

  it('signs in with a link pasted after requesting it (iPhone Home Screen app)', async () => {
    const { user, input, onPasteLink } = setup();
    await user.type(input, 'me@example.com{Enter}');
    const link = screen.getByLabelText('Sign-in link');
    expect(link).toHaveFocus();
    await user.type(link, 'https://example.com/link{Enter}');
    expect(onPasteLink).toHaveBeenCalledWith('me@example.com', 'https://example.com/link');
  });

  it('explains a pasted text that is not a sign-in link', async () => {
    const { user, input, onPasteLink } = setup();
    onPasteLink.mockRejectedValueOnce({ code: 'taskdone/not-a-link' });
    await user.type(input, 'me@example.com{Enter}');
    const link = screen.getByLabelText('Sign-in link');
    await user.type(link, 'hello{Enter}');
    expect(link).toHaveAttribute('aria-invalid', 'true');
    expect(link).toHaveAccessibleDescription(/not a sign-in link/);
  });

  it('accepts a link from an earlier request', async () => {
    const { user, onPasteLink } = setup();
    await user.click(screen.getByRole('button', { name: 'I already have a link' }));
    await user.type(screen.getByLabelText('Email'), 'me@example.com');
    await user.type(screen.getByLabelText('Sign-in link'), 'https://example.com/link{Enter}');
    expect(onPasteLink).toHaveBeenCalledWith('me@example.com', 'https://example.com/link');
  });

  it('explains an invalid email next to the field', async () => {
    const { user, input, onRequest } = setup();
    await user.type(input, 'me@{Enter}');
    expect(onRequest).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter an email like name@example.com.');
  });

  it('shows a recoverable error when sending fails', async () => {
    const { user, input, onRequest } = setup();
    onRequest.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    await user.type(input, 'me@example.com{Enter}');
    expect(screen.getByText(/Check your connection and try again/)).toBeInTheDocument();
  });

  it('confirms the email for a link opened on another device', async () => {
    const { user, input, onConfirm } = setup('confirm');
    expect(screen.getByRole('heading', { name: 'Confirm your email' })).toBeInTheDocument();
    await user.type(input, 'me@example.com');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onConfirm).toHaveBeenCalledWith('me@example.com');
  });
});
