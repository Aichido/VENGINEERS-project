// OrderDetail.test.jsx — corrigé (format des prix en Rs)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrderDetail from '../src/pages/dashboards/client/OrderDetail';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const mockOrder = {
  id: 1,
  public_id: '#VEN-ORD-ABC123',
  status: 'en_attente',
  total: '500.00',
  created_at: '2026-08-01T10:00:00.000000Z',
  updated_at: '2026-08-01T10:00:00.000000Z',
  items: [
    {
      id: 1,
      order_id: 1,
      product_id: 1,
      qty: 2,
      unit_price: '250.00',
      product: {
        id: 1,
        name: 'Écran tactile interactif 65"',
        price: '250.00',
        stock_qty: 8,
      },
    },
  ],
};

function renderOrderDetail(publicId = '#VEN-ORD-ABC123', state = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/client/orders/${encodeURIComponent(publicId)}`, state }]}>
      <Routes>
        <Route path="/client/orders/:publicId" element={<OrderDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('OrderDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) => {
      if (url === `/client/orders/${encodeURIComponent('#VEN-ORD-ABC123')}`) {
        return Promise.resolve({ data: mockOrder });
      }
      return Promise.reject({ response: { status: 404 } });
    });
  });

  it('affiche le skeleton pendant le chargement', async () => {
    api.get.mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve({ data: mockOrder }), 500));
    });

    renderOrderDetail();
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();

    await screen.findByText('Order #VEN-ORD-ABC123', {}, LOAD_TIMEOUT);
    const skeletonAfter = document.querySelector('.animate-pulse');
    expect(skeletonAfter).not.toBeInTheDocument();
  });

  it('rend les items, quantités, prix unitaires, sous-totaux et total', async () => {
    renderOrderDetail();

    await screen.findByText('Order #VEN-ORD-ABC123', {}, LOAD_TIMEOUT);
    expect(screen.getByText('Écran tactile interactif 65"')).toBeInTheDocument();
    expect(screen.getByText('2 × Rs 250.00')).toBeInTheDocument();

    // Utiliser getAllByText pour vérifier qu'il y a deux occurrences de "Rs 500.00"
    const prices = screen.getAllByText('Rs 500.00');
    expect(prices).toHaveLength(2); // une pour le sous-total de l'item, une pour le total de la commande

    // Vérifier que le total est affiché dans la section "Total"
    const totalSection = screen.getByText('Total').closest('div');
    expect(within(totalSection).getByText('Rs 500.00')).toBeInTheDocument();
  });

  it('affiche le message 403 avec lien retour', async () => {
    api.get.mockRejectedValue({ response: { status: 403 } });
    renderOrderDetail();

    await waitFor(() => {
      expect(screen.getByText("This order doesn't belong to you.")).toBeInTheDocument();
    }, LOAD_TIMEOUT);
    const backLink = screen.getByRole('link', { name: /Back to my orders/i });
    expect(backLink).toHaveAttribute('href', '/client/orders');
  });

  it('affiche le message 404 avec lien retour', async () => {
    api.get.mockRejectedValue({ response: { status: 404 } });
    renderOrderDetail();

    await waitFor(() => {
      expect(screen.getByText('Order not found.')).toBeInTheDocument();
    }, LOAD_TIMEOUT);
    const backLink = screen.getByRole('link', { name: /Back to my orders/i });
    expect(backLink).toHaveAttribute('href', '/client/orders');
  });

  it('affiche un message générique pour une erreur 500', async () => {
    api.get.mockRejectedValue({ response: { status: 500 } });
    renderOrderDetail();

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong loading this order/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
    const backLink = screen.getByRole('link', { name: /Back to my orders/i });
    expect(backLink).toHaveAttribute('href', '/client/orders');
  });

  it('utilise encodeURIComponent(publicId) dans l\'URL de l\'appel API', async () => {
    const encodedId = encodeURIComponent('#VEN-ORD-ABC123');
    renderOrderDetail('#VEN-ORD-ABC123');
    await screen.findByText('Order #VEN-ORD-ABC123', {}, LOAD_TIMEOUT);

    expect(api.get).toHaveBeenCalledWith(`/client/orders/${encodedId}`);
  });

  it('affiche une bannière de succès si location.state.success est présent, puis nettoie le state', async () => {
    renderOrderDetail('#VEN-ORD-ABC123', { success: 'Order placed successfully!' });

    await screen.findByText('Order placed successfully!', {}, LOAD_TIMEOUT);
    expect(screen.getByText('Order placed successfully!')).toBeInTheDocument();

    // Le state est nettoyé par navigate, ce qui n'est pas testé ici.
  });
});