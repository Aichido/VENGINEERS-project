import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

function TestConsumer() {
  const { user, login, register, logout, loading } = useAuth();

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user ? user.email : 'no-user'}</span>
      <button onClick={() => login('test@vengineers.mu', 'password')}>login</button>
      <button onClick={() => register({ name: 'Test', email: 'test@vengineers.mu', password: 'password', password_confirmation: 'password' })}>register</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

describe('AuthContext / AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("sans token existant, ne fait aucun appel /me et passe loading à false", async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(api.get).not.toHaveBeenCalled();
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it("avec un token valide, charge l'utilisateur via /me", async () => {
    localStorage.setItem('token', 'valid-token');
    api.get.mockResolvedValueOnce({ data: { email: 'test@vengineers.mu' } });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@vengineers.mu');
    });

    expect(api.get).toHaveBeenCalledWith('/me');
    expect(screen.getByTestId('loading')).toHaveTextContent('ready');
  });

  it("si /me échoue, supprime le token du localStorage et laisse user vide", async () => {
    localStorage.setItem('token', 'expired-token');
    api.get.mockRejectedValueOnce(new Error('Unauthenticated'));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it("login() stocke le token et met à jour l'utilisateur", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({
      data: { token: 'new-token', user: { email: 'test@vengineers.mu' } },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    await user.click(screen.getByText('login'));

    expect(api.post).toHaveBeenCalledWith('/login', {
      email: 'test@vengineers.mu',
      password: 'password',
    });
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(screen.getByTestId('user')).toHaveTextContent('test@vengineers.mu');
  });

  it("register() appelle l'API /register avec le payload et ne modifie pas l'utilisateur (pas d'auto-login)", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: {} });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    await user.click(screen.getByText('register'));

    expect(api.post).toHaveBeenCalledWith('/register', {
      name: 'Test',
      email: 'test@vengineers.mu',
      password: 'password',
      password_confirmation: 'password',
    });
    // L'utilisateur ne doit pas être connecté automatiquement
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it("logout() supprime le token et vide l'utilisateur", async () => {
    localStorage.setItem('token', 'valid-token');
    api.get.mockResolvedValueOnce({ data: { email: 'test@vengineers.mu' } });
    api.post.mockResolvedValueOnce({ data: {} });

    const user = userEvent.setup();
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@vengineers.mu');
    });

    await user.click(screen.getByText('logout'));

    expect(api.post).toHaveBeenCalledWith('/logout');
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });
});