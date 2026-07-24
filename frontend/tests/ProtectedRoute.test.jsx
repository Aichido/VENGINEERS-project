import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../src/routes/ProtectedRoute';
import { useAuth } from '../src/context/AuthContext';

// On mocke useAuth pour contrôler user/loading indépendamment du vrai AuthProvider.
vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// On mocke Navigate pour capturer la cible de redirection sans avoir besoin
// d'un vrai contexte de routeur (MemoryRouter, etc.).
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

  it("affiche 'Chargement...' pendant que loading est vrai", () => {
    useAuth.mockReturnValue({ user: null, loading: true });

    render(
      <ProtectedRoute>
        <p>Contenu protégé</p>
      </ProtectedRoute>
    );

    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
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
