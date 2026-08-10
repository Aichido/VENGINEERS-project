import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrderDetail from '../src/pages/dashboards/commercial/OrderDetail';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

function baseOrder(overrides = {}) {
  return {
    public_id: '#VEN-ORD-AAA11111',
    status: 'en_attente',
    total: '200.00',
    client: { name: 'Nexus Systems', email: 'nexus@example.com' },
    commercial: null,
    items: [
      { id: 1, qty: 2, unit_price: '100.00', product: { name: 'Touch Panel 55"' } },
    ],
    ...overrides,
  };
}

function renderDetail(publicId = '#VEN-ORD-AAA11111') {
  return render(
    <MemoryRouter initialEntries={[`/commercial/orders/${encodeURIComponent(publicId)}`]}>
      <Routes>
        <Route path="/commercial/orders/:publicId" element={<OrderDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.put.mockReset();
});

describe('Commercial OrderDetail page', () => {
  it('renders order info, items and total', async () => {
    api.get.mockResolvedValue({ data: baseOrder() });

    renderDetail();

    expect(await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText(/nexus systems/i)).toBeInTheDocument();
    expect(screen.getByText('Touch Panel 55"')).toBeInTheDocument();
    expect(screen.getAllByText('$200.00')).toHaveLength(2);
  });
1  
  it('fetches the order using the encoded public_id', async () => {
    api.get.mockResolvedValue({ data: baseOrder() });

    renderDetail();
    await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT);

    expect(api.get).toHaveBeenCalledWith('/commercial/orders/%23VEN-ORD-AAA11111');
  });

  it('shows Validate and Cancel actions for a pending order', async () => {
    api.get.mockResolvedValue({ data: baseOrder({ status: 'en_attente' }) });

    renderDetail();

    expect(await screen.findByRole('button', { name: /^validate$/i }, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
  });

  it('shows Mark as Shipped and Cancel for a validated order', async () => {
    api.get.mockResolvedValue({ data: baseOrder({ status: 'validee' }) });

    renderDetail();

    expect(
      await screen.findByRole('button', { name: /mark as shipped/i }, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
  });

  it('shows no actions for a delivered order', async () => {
    api.get.mockResolvedValue({ data: baseOrder({ status: 'livree' }) });

    renderDetail();

    await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT);
    expect(screen.queryByRole('button', { name: /validate|cancel|shipped|delivered/i })).not.toBeInTheDocument();
  });

  it('performs the Validate action and updates the displayed status', async () => {
    api.get.mockResolvedValue({ data: baseOrder({ status: 'en_attente' }) });
    api.put.mockResolvedValue({ data: baseOrder({ status: 'validee' }) });

    renderDetail();
    await screen.findByRole('button', { name: /^validate$/i }, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^validate$/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/commercial/orders/%23VEN-ORD-AAA11111',
        { status: 'validee' }
      );
    }, LOAD_TIMEOUT);

    expect(await screen.findByText('validee', {}, LOAD_TIMEOUT)).toBeInTheDocument();
  });

  it('shows an inline error when an action fails with a 422', async () => {
    api.get.mockResolvedValue({ data: baseOrder({ status: 'en_attente' }) });
    api.put.mockRejectedValue({
      response: { status: 422, data: { errors: { items: ['Insufficient stock.'] } } },
    });

    renderDetail();
    await screen.findByRole('button', { name: /^validate$/i }, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^validate$/i }));

    expect(await screen.findByText('Insufficient stock.', {}, LOAD_TIMEOUT)).toBeInTheDocument();
  });

  it('shows a not-found message and back link for a 404', async () => {
    api.get.mockRejectedValue({ response: { status: 404 } });

    renderDetail();

    expect(await screen.findByText(/order not found/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to orders/i })).toHaveAttribute(
      'href',
      '/commercial/orders'
    );
  });
});