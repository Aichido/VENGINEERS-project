// ClientDashboard.test.jsx corrigé

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientDashboard from '../src/pages/dashboards/client/ClientDashboard';
import api from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';

// Génère une date ISO relative à "maintenant", pour que les tests basés sur
// des fenêtres glissantes (ex. "livré dans les 30 derniers jours") restent
// stables indépendamment du jour où la suite est exécutée.
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const mockOrders = [
  {
    id: 1,
    public_id: '#VEN-ORD-ABC123',
    status: 'en_attente',
    total: '500.00',
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    items: [{ id: 1, product_id: 1, qty: 2, unit_price: '250.00' }],
  },
  {
    id: 2,
    public_id: '#VEN-ORD-DEF456',
    status: 'livree',
    total: '1200.00',
    created_at: daysAgo(45), // hors des 30 derniers jours : n'affecte pas le compteur "Delivered (30d)"
    updated_at: daysAgo(10), // livrée il y a 10 jours : reste dans la fenêtre de 30 jours quel que soit le jour d'exécution
    items: [{ id: 2, product_id: 2, qty: 1, unit_price: '1200.00' }],
  },
];

const mockInterventions = [
  {
    id: 1,
    titre: 'Écran ne s\'allume plus',
    description: 'Plus aucune image',
    equipement: 'Écran 65"',
    date_souhaitee: '2026-08-10T00:00:00.000000Z',
    client_id: 3,
    statut: 'nouvelle',
    priorite: 'normale',
    public_id: '#VEN-INT-XEFBYHE9',
    created_at: '2026-08-06T19:43:35.000000Z',
    updated_at: '2026-08-06T19:43:35.000000Z',
  },
];

describe('ClientDashboard', () => {
  const mockUser = { name: 'John Doe', role: { name: 'client' } };

  const renderDashboard = () => {
    useAuth.mockReturnValue({ user: mockUser });
    return render(
      <MemoryRouter initialEntries={['/client']}>
        <ClientDashboard />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === '/client/orders') {
        return Promise.resolve({ data: { data: mockOrders } });
      }
      if (url === '/client/interventions') {
        return Promise.resolve({ data: { data: mockInterventions } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('affiche les skeletons pendant le chargement', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/client/orders') {
        return new Promise((resolve) => setTimeout(() => resolve({ data: { data: mockOrders } }), 500));
      }
      if (url === '/client/interventions') {
        return new Promise((resolve) => setTimeout(() => resolve({ data: { data: mockInterventions } }), 500));
      }
      return Promise.resolve({ data: {} });
    });

    renderDashboard();

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText('Active Orders')).toBeInTheDocument();
    }, LOAD_TIMEOUT);

    await waitFor(() => {
      const skeletonsAfter = document.querySelectorAll('.animate-pulse');
      expect(skeletonsAfter.length).toBe(0);
    }, LOAD_TIMEOUT);
  });

  it('appelle api.get pour /client/orders et /client/interventions au montage', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/client/orders');
      expect(api.get).toHaveBeenCalledWith('/client/interventions');
    }, LOAD_TIMEOUT);
  });

  it('affiche les commandes actives (non livrées ni annulées) – max 3', async () => {
    renderDashboard();

    await screen.findByText('Order #VEN-ORD-ABC123', {}, LOAD_TIMEOUT);
    expect(screen.queryByText('Order #VEN-ORD-DEF456')).not.toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('affiche un message "No active orders" si aucune commande active', async () => {
    const allDelivered = mockOrders.map(o => ({ ...o, status: 'livree' }));
    api.get.mockImplementation((url) => {
      if (url === '/client/orders') {
        return Promise.resolve({ data: { data: allDelivered } });
      }
      if (url === '/client/interventions') {
        return Promise.resolve({ data: { data: mockInterventions } });
      }
      return Promise.resolve({ data: {} });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/No active orders right now/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });

  it('calcule correctement Total Spent, Active count et Delivered (30d)', async () => {
    renderDashboard();

    // Attendre que les données soient chargées et que "Total Spent" soit affiché
    const totalElement = await screen.findByText('1,700 €', {}, LOAD_TIMEOUT);
    expect(totalElement).toBeInTheDocument();

    // Vérifier Active count = 1
    const activeDiv = screen.getByText('Active').closest('div');
    const activeCount = within(activeDiv).getByText('1');
    expect(activeCount).toBeInTheDocument();

    // Vérifier Delivered (30d) = 1
    const deliveredDiv = screen.getByText('Delivered (30d)').closest('div');
    const deliveredCount = within(deliveredDiv).getByText('1');
    expect(deliveredCount).toBeInTheDocument();
  });

  it('le lien vers une commande utilise encodeURIComponent(public_id)', async () => {
    renderDashboard();

    const orderLink = await screen.findByRole('link', { name: /Order #VEN-ORD-ABC123/i });
    expect(orderLink).toHaveAttribute('href', '/client/orders/%23VEN-ORD-ABC123');
  });

  it('affiche la timeline des interventions', async () => {
    renderDashboard();

    await screen.findByText("Écran ne s'allume plus", {}, LOAD_TIMEOUT);
    expect(screen.getByText('#VEN-INT-XEFBYHE9')).toBeInTheDocument();
    expect(screen.getByText('Écran 65"')).toBeInTheDocument();
    expect(screen.getByText('10 Aug')).toBeInTheDocument();
  });

  it('affiche "No interventions yet" si la liste est vide', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/client/orders') {
        return Promise.resolve({ data: { data: mockOrders } });
      }
      if (url === '/client/interventions') {
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/No interventions yet/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });

  it('affiche une bannière d\'erreur si l\'un des appels échoue', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/client/orders') {
        return Promise.reject(new Error('Network error'));
      }
      if (url === '/client/interventions') {
        return Promise.resolve({ data: { data: mockInterventions } });
      }
      return Promise.resolve({ data: {} });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong loading your dashboard data/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });
});