import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../src/routes/ProtectedRoute';
import { useAuth } from '../src/context/AuthContext';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le spinner pendant que loading est vrai", () => {
    useAuth.mockReturnValue({ user: null, loading: true });

    const { container } = render(
      <ProtectedRoute>
        <p>Contenu protégé</p>
      </ProtectedRoute>
    );

    // Vérifier la présence du spinner via la classe animate-spin
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it("redirige vers /login si l'utilisateur n'est pas authentifié", () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    render(
      <ProtectedRoute>
        <p>Contenu protégé</p>
      </ProtectedRoute>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/login');
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it("redirige vers / si le rôle de l'utilisateur n'est pas autorisé", () => {
    useAuth.mockReturnValue({
      user: { role: { name: 'client' } },
      loading: false,
    });

    render(
      <ProtectedRoute allowedRoles={['admin', 'commercial']}>
        <p>Contenu protégé</p>
      </ProtectedRoute>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/');
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it("affiche le contenu si l'utilisateur a un rôle autorisé", () => {
    useAuth.mockReturnValue({
      user: { role: { name: 'admin' } },
      loading: false,
    });

    render(
      <ProtectedRoute allowedRoles={['admin', 'commercial']}>
        <p>Contenu protégé</p>
      </ProtectedRoute>
    );

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it("affiche le contenu si aucun allowedRoles n'est précisé, quel que soit le rôle", () => {
    useAuth.mockReturnValue({
      user: { role: { name: 'client' } },
      loading: false,
    });

    render(
      <ProtectedRoute>
        <p>Contenu protégé</p>
      </ProtectedRoute>
    );

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });
});