// Orders.test.jsx (version finale avec correction du test "rend une carte commande")
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Orders from '../src/pages/dashboards/client/Orders';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const mockOrdersPage1 = {
  data: [
    {
      id: 1,
      public_id: '#VEN-ORD-ABC123',
      status: 'en_attente',
      total: '500.00',
      created_at: '2026-08-01T10:00:00.000000Z',
      updated_at: '2026-08-01T10:00:00.000000Z',
      items: [{ id: 1, product_id: 1, qty: 2, unit_price: '250.00' }],
    },
    {
      id: 2,
      public_id: '#VEN-ORD-DEF456',
      status: 'livree',
      total: '1200.00',
      created_at: '2026-07-15T10:00:00.000000Z',
      updated_at: '2026-07-20T10:00:00.000000Z',
      items: [{ id: 2, product_id: 2, qty: 1, unit_price: '1200.00' }],
    },
  ],
  current_page: 1,
  last_page: 2,
};

const mockOrdersPage2 = {
  data: [
    {
      id: 3,
      public_id: '#VEN-ORD-GHI789',
      status: 'validee',
      total: '850.00',
      created_at: '2026-06-20T10:00:00.000000Z',
      updated_at: '2026-06-21T10:00:00.000000Z',
      items: [{ id: 3, product_id: 3, qty: 1, unit_price: '850.00' }],
    },
  ],
  current_page: 2,
  last_page: 2,
};

describe('Orders', () => {
  const renderOrders = (initialEntries = ['/client/orders']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Orders />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url, { params } = {}) => {
      if (url === '/client/orders') {
        if (params?.page === 2) {
          return Promise.resolve({ data: mockOrdersPage2 });
        }
        return Promise.resolve({ data: mockOrdersPage1 });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('affiche les squelettes pendant le chargement', async () => {
    api.get.mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve({ data: mockOrdersPage1 }), 500));
    });

    renderOrders();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    await screen.findByText('Order #VEN-ORD-ABC123', {}, LOAD_TIMEOUT);
    const skeletonsAfter = document.querySelectorAll('.animate-pulse');
    expect(skeletonsAfter.length).toBe(0);
  });

  it('affiche un message si aucune commande', async () => {
    api.get.mockResolvedValue({ data: { data: [], current_page: 1, last_page: 1 } });
    renderOrders();

    await waitFor(() => {
      expect(screen.getByText("You haven't placed any orders yet.")).toBeInTheDocument();
    }, LOAD_TIMEOUT);
    expect(screen.getByRole('link', { name: /Browse the catalog/i })).toHaveAttribute('href', '/products');
  });

  it('affiche une erreur si l\'appel API échoue', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderOrders();

    await waitFor(() => {
      expect(screen.getByText("Couldn't load your orders. Please try again later.")).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });

  it('rend une carte commande avec public_id, statut, total et date', async () => {
    renderOrders();

    // Récupérer le lien de la première commande
    const orderLink = await screen.findByRole('link', { name: /Order #VEN-ORD-ABC123/i });
    expect(orderLink).toBeInTheDocument();

    // Utiliser `within` pour rechercher uniquement à l'intérieur de cette carte
    const withinLink = within(orderLink);
    expect(withinLink.getByText('Pending')).toBeInTheDocument();
    expect(withinLink.getByText('Rs 500.00')).toBeInTheDocument();
    expect(withinLink.getByText(/1 Aug 2026/)).toBeInTheDocument();
    expect(withinLink.getByText(/1 item\(s\)/)).toBeInTheDocument();
  });

  it('le lien de commande encode correctement le public_id', async () => {
    renderOrders();
    const orderLink = await screen.findByRole('link', { name: /Order #VEN-ORD-ABC123/i });
    expect(orderLink).toHaveAttribute('href', '/client/orders/%23VEN-ORD-ABC123');
  });

  it('gère la pagination : bouton Previous désactivé en page 1', async () => {
    renderOrders();
    await screen.findByText('Order #VEN-ORD-ABC123', {}, LOAD_TIMEOUT);

    const prevButton = screen.getByRole('button', { name: /Previous/i });
    expect(prevButton).toBeDisabled();

    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('appelle api.get avec le bon paramètre page quand on clique sur Next', async () => {
    const user = userEvent.setup();
    renderOrders();
    await screen.findByText('Order #VEN-ORD-ABC123', {}, LOAD_TIMEOUT);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/client/orders', { params: { page: 2 } });
    });

    await screen.findByText('Order #VEN-ORD-GHI789', {}, LOAD_TIMEOUT);
    expect(screen.queryByText('Order #VEN-ORD-ABC123')).not.toBeInTheDocument();
  });

  it('désactive le bouton Next en dernière page', async () => {
    api.get.mockImplementation((url, { params } = {}) => {
      if (params?.page === 2) {
        return Promise.resolve({ data: { ...mockOrdersPage2, last_page: 2 } });
      }
      return Promise.resolve({ data: mockOrdersPage1 });
    });

    const user = userEvent.setup();
    renderOrders();
    await screen.findByText('Order #VEN-ORD-ABC123', {}, LOAD_TIMEOUT);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await screen.findByText('Order #VEN-ORD-GHI789', {}, LOAD_TIMEOUT);
    expect(nextButton).toBeDisabled();
  });
});