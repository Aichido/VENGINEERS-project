import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommercialDashboard from '../src/pages/dashboards/commercial/CommercialDashboard';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: { get: vi.fn() },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const sampleOrders = {
  data: [
    { id: 1, public_id: '#VEN-ORD-AAA11111', status: 'en_attente', client: { name: 'Nexus Systems' } },
  ],
  total: 1,
};

const sampleStock = {
  data: [
    { id: 10, name: 'Low Stock Item', stock_qty: 2 },
    { id: 11, name: 'Healthy Item', stock_qty: 40 },
  ],
  total: 2,
};

function defaultMockImplementation(url) {
  if (url === '/commercial/orders') return Promise.resolve({ data: sampleOrders });
  if (url === '/commercial/stock') return Promise.resolve({ data: sampleStock });
  return Promise.resolve({ data: {} });
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <CommercialDashboard />
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.get.mockImplementation(defaultMockImplementation);
});

describe('CommercialDashboard', () => {
  it('renders pending orders and tracked products counts', async () => {
    renderDashboard();

    expect(await screen.findByText('Overview', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(await screen.findByText('1', {}, LOAD_TIMEOUT)).toBeInTheDocument(); // pending orders total
    expect(screen.getByText('2')).toBeInTheDocument(); // products tracked total
  });

  it('lists the lowest stock products', async () => {
    renderDashboard();

    expect(await screen.findByText('Low Stock Item', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('2 left')).toBeInTheDocument();
  });

  it('lists pending orders with client name and status', async () => {
    renderDashboard();

    expect(await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('Nexus Systems')).toBeInTheDocument();
  });

  it('shows an empty state when there are no pending orders', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/commercial/orders') return Promise.resolve({ data: { data: [], total: 0 } });
      if (url === '/commercial/stock') return Promise.resolve({ data: sampleStock });
      return Promise.resolve({ data: {} });
    });

    renderDashboard();

    expect(await screen.findByText(/no pending orders/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
  });

  it('shows an error message when loading fails', async () => {
    api.get.mockImplementation(() => Promise.reject(new Error('Network Error')));

    renderDashboard();

    expect(
      await screen.findByText(/unable to load dashboard data/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });
});