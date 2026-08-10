import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Orders from '../src/pages/dashboards/commercial/Orders';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const pendingOrder = {
  id: 1,
  public_id: '#VEN-ORD-AAA11111',
  status: 'en_attente',
  total: '100.00',
  client: { name: 'Nexus Systems' },
};

function makeOrdersResponse(overrides = {}) {
  return {
    current_page: 1,
    last_page: 1,
    prev_page_url: null,
    next_page_url: null,
    data: [pendingOrder],
    ...overrides,
  };
}

function renderOrders() {
  return render(
    <MemoryRouter>
      <Orders />
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.put.mockReset();
  api.get.mockResolvedValue({ data: makeOrdersResponse() });
});

describe('Commercial Orders page', () => {
  it('renders the order list with client name, total and status', async () => {
    renderOrders();

    expect(await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('Nexus Systems')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('requests the correct status filter when a tab is clicked', async () => {
    renderOrders();
    await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Validated' }));

    await waitFor(() => {
      const lastCall = api.get.mock.calls.at(-1);
      expect(lastCall[1].params.status).toBe('validee');
    }, LOAD_TIMEOUT);
  });

  it('validates a pending order and updates the row on success', async () => {
    api.put.mockResolvedValue({ data: { ...pendingOrder, status: 'validee' } });

    renderOrders();
    await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT);

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

  it('shows an inline error when validation fails with a 422', async () => {
    api.put.mockRejectedValue({
      response: { status: 422, data: { errors: { items: ['Insufficient stock.'] } } },
    });

    renderOrders();
    await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^validate$/i }));

    expect(await screen.findByText('Insufficient stock.', {}, LOAD_TIMEOUT)).toBeInTheDocument();
  });

  it('links to the order detail page with the public_id encoded', async () => {
    renderOrders();
    await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT);

    expect(screen.getByRole('link', { name: /view/i })).toHaveAttribute(
      'href',
      '/commercial/orders/%23VEN-ORD-AAA11111'
    );
  });

  it('shows an empty state when there are no orders', async () => {
    api.get.mockResolvedValue({ data: makeOrdersResponse({ data: [] }) });

    renderOrders();

    expect(await screen.findByText(/no orders found/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
  });

  it('does not render pagination when there is only one page', async () => {
  renderOrders(); // makeOrdersResponse() par défaut a last_page: 1
  await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT);

  expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
});

it('disables Previous but not Next on the first page when there are multiple pages', async () => {
  api.get.mockResolvedValue({ data: makeOrdersResponse({ last_page: 2 }) });

  renderOrders();
  await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT);

  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
});

it('requests the next page when Next is clicked', async () => {
  api.get.mockResolvedValue({ data: makeOrdersResponse({ last_page: 2 }) });

  renderOrders();
  await screen.findByText('#VEN-ORD-AAA11111', {}, LOAD_TIMEOUT);

  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Next' }));

  await waitFor(() => {
    const lastCall = api.get.mock.calls.at(-1);
    expect(lastCall[1].params.page).toBe(2);
  }, LOAD_TIMEOUT);
});
});