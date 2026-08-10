import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Stock from '../src/pages/dashboards/commercial/Stock';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

function makeStockResponse(overrides = {}) {
  return {
    current_page: 1,
    last_page: 1,
    prev_page_url: null,
    next_page_url: null,
    data: [
      { id: 21, name: 'Low Stock Product', price: '90.00', stock_qty: 2 },
      { id: 22, name: 'Healthy Product', price: '200.00', stock_qty: 40 },
    ],
    ...overrides,
  };
}

function renderStock() {
  return render(
    <MemoryRouter>
      <Stock />
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  api.get.mockResolvedValue({ data: makeStockResponse() });
});

describe('Commercial Stock page', () => {
  it('renders products with price and stock quantity', async () => {
    renderStock();

    expect(await screen.findByText('Low Stock Product', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('Healthy Product')).toBeInTheDocument();
    expect(screen.getByText('$90.00')).toBeInTheDocument();
  });

  it('shows a "Low stock" badge and Notify button only for low-stock products', async () => {
    renderStock();
    await screen.findByText('Low Stock Product', {}, LOAD_TIMEOUT);

    expect(screen.getByText('Low stock')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /notify admin/i })).toBeInTheDocument();
  });

  it('triggers the low-stock notification and shows a confirmation state', async () => {
    api.post.mockResolvedValue({ data: { message: 'Admins notifiés.' } });

    renderStock();
    await screen.findByText('Low Stock Product', {}, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /notify admin/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/commercial/stock/21/notify-low-stock');
    }, LOAD_TIMEOUT);

    expect(await screen.findByRole('button', { name: /notified/i }, LOAD_TIMEOUT)).toBeDisabled();
  });

  it('requests the correct page on Next click', async () => {
    api.get.mockResolvedValue({
      data: makeStockResponse({ current_page: 1, last_page: 2, next_page_url: 'x' }),
    });

    renderStock();
    await screen.findByText('Low Stock Product', {}, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      const lastCall = api.get.mock.calls.at(-1);
      expect(lastCall[1].params.page).toBe(2);
    }, LOAD_TIMEOUT);
  });

  it('shows an error message when loading fails', async () => {
    api.get.mockRejectedValue(new Error('Network Error'));

    renderStock();

    expect(await screen.findByText(/unable to load stock/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
  });
});