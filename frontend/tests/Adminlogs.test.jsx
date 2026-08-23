import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import AdminLogs from '../src/pages/dashboards/admin/AdminLogs';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const mockEntries = [
  {
    type: 'activity_log',
    timestamp: '2026-08-20T10:00:00.000Z',
    user_id: 3,
    action_or_event: 'product_created',
    summary: 'product_created — product #12',
    raw: { action: 'product_created', entity: 'product', entity_id: 12 },
  },
  {
    type: 'order_history',
    timestamp: '2026-08-20T09:30:00.000Z',
    user_id: 5,
    action_or_event: 'validee',
    summary: "Commande #7 : en_attente → validee",
    raw: { order_id: 7, status_from: 'en_attente', status_to: 'validee' },
  },
  {
    type: 'intervention_history',
    timestamp: '2026-08-20T09:00:00.000Z',
    user_id: 8,
    action_or_event: 'created',
    summary: 'Intervention #4 : created',
    raw: { intervention_id: 4, event: 'created' },
  },
  {
    type: 'login_audit',
    timestamp: '2026-08-20T08:00:00.000Z',
    user_id: null,
    action_or_event: 'access_denied',
    summary: 'access_denied (échec) — route=api/admin/users required=admin has=client',
    raw: { action: 'access_denied', success: false },
  },
];

function makePage(entries, meta = {}) {
  return {
    data: entries,
    meta: {
      current_page: 1,
      per_page: 15,
      total: entries.length,
      last_page: 1,
      ...meta,
    },
  };
}

describe('Admin AdminLogs', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.get.mockResolvedValue({ data: makePage(mockEntries) });
  });

  it('loads and displays log entries with their type badge and summary', async () => {
    render(<AdminLogs />);

    await screen.findByText(/product_created — product #12/i, {}, LOAD_TIMEOUT);

    expect(screen.getByText(/Commande #7 : en_attente → validee/i)).toBeInTheDocument();
    expect(screen.getByText(/Intervention #4 : created/i)).toBeInTheDocument();
    expect(screen.getByText(/access_denied/i)).toBeInTheDocument();

    // Badges de type visibles sur les entrées (scopé pour ne pas matcher les onglets de filtre)
    const activityCard = screen.getByText(/product_created — product #12/i).closest('div.rounded-xl');
    expect(within(activityCard).getByText('Activity')).toBeInTheDocument();

    const orderCard = screen.getByText(/Commande #7/i).closest('div.rounded-xl');
    expect(within(orderCard).getByText('Order')).toBeInTheDocument();

    const interventionCard = screen.getByText(/Intervention #4/i).closest('div.rounded-xl');
    expect(within(interventionCard).getByText('Intervention')).toBeInTheDocument();

    const authCard = screen.getByText(/access_denied/i).closest('div.rounded-xl');
    expect(within(authCard).getByText('Auth')).toBeInTheDocument();
  });

  it('shows "User #x" for entries with a user_id and "System" when null', async () => {
    render(<AdminLogs />);

    await screen.findByText(/product_created — product #12/i, {}, LOAD_TIMEOUT);

    const activityCard = screen.getByText(/product_created — product #12/i).closest('div.rounded-xl');
    expect(within(activityCard).getByText(/User #3/)).toBeInTheDocument();

    const authCard = screen.getByText(/access_denied/i).closest('div.rounded-xl');
    expect(within(authCard).getByText(/System/)).toBeInTheDocument();
  });

  it('requests the default (unfiltered) page on mount', async () => {
    render(<AdminLogs />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/logs',
        expect.objectContaining({
          params: expect.objectContaining({
            type: undefined,
            user_id: undefined,
            action: undefined,
            date_from: undefined,
            date_to: undefined,
            page: 1,
          }),
        })
      );
    }, LOAD_TIMEOUT);
  });

  it('filters by type when a tab is clicked', async () => {
    const user = userEvent.setup();
    render(<AdminLogs />);

    await screen.findByText(/product_created — product #12/i, {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /^orders$/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/logs',
        expect.objectContaining({ params: expect.objectContaining({ type: 'order_history', page: 1 }) })
      );
    }, LOAD_TIMEOUT);
  });

  it('filters by user_id after debounce', async () => {
    const user = userEvent.setup();
    render(<AdminLogs />);

    await screen.findByText(/product_created — product #12/i, {}, LOAD_TIMEOUT);
    await user.type(screen.getByLabelText(/user id/i), '5');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/logs',
        expect.objectContaining({ params: expect.objectContaining({ user_id: '5' }) })
      );
    }, LOAD_TIMEOUT);
  });

  it('filters by action after debounce', async () => {
    const user = userEvent.setup();
    render(<AdminLogs />);

    await screen.findByText(/product_created — product #12/i, {}, LOAD_TIMEOUT);
    await user.type(screen.getByLabelText(/action/i), 'product_created');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/logs',
        expect.objectContaining({ params: expect.objectContaining({ action: 'product_created' }) })
      );
    }, LOAD_TIMEOUT);
  });

  it('filters by a date range', async () => {
    render(<AdminLogs />);

    await screen.findByText(/product_created — product #12/i, {}, LOAD_TIMEOUT);

    fireEvent.change(screen.getByLabelText(/^from$/i), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText(/^to$/i), { target: { value: '2026-08-31' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/logs',
        expect.objectContaining({
          params: expect.objectContaining({ date_from: '2026-08-01', date_to: '2026-08-31' }),
        })
      );
    }, LOAD_TIMEOUT);
  });

  it('shows a reset filters button once a filter is active, and clears filters on click', async () => {
    const user = userEvent.setup();
    render(<AdminLogs />);

    await screen.findByText(/product_created — product #12/i, {}, LOAD_TIMEOUT);

    expect(screen.queryByRole('button', { name: /reset filters/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^orders$/i }));

    const resetButton = await screen.findByRole('button', { name: /reset filters/i }, LOAD_TIMEOUT);
    await user.click(resetButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/admin/logs',
        expect.objectContaining({ params: expect.objectContaining({ type: undefined, page: 1 }) })
      );
    }, LOAD_TIMEOUT);

    expect(screen.queryByRole('button', { name: /reset filters/i })).not.toBeInTheDocument();
  });

  it('paginates and requests the next page', async () => {
    api.get.mockImplementation((url, config) => {
      const page = config?.params?.page ?? 1;
      if (page === 2) {
        return Promise.resolve({
          data: makePage([mockEntries[0]], { current_page: 2, last_page: 2, total: 20 }),
        });
      }
      return Promise.resolve({ data: makePage(mockEntries, { last_page: 2, total: 20 }) });
    });

    const user = userEvent.setup();
    render(<AdminLogs />);

    await screen.findByText(/product_created — product #12/i, {}, LOAD_TIMEOUT);

    const previousButton = screen.getByRole('button', { name: /previous/i });
    expect(previousButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/logs',
        expect.objectContaining({ params: expect.objectContaining({ page: 2 }) })
      );
    }, LOAD_TIMEOUT);
  });

  it('shows an empty state with no filters', async () => {
    api.get.mockResolvedValue({ data: makePage([]) });

    render(<AdminLogs />);

    await waitFor(() => {
      expect(screen.getByText(/no log entries yet/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);

    expect(screen.queryByRole('button', { name: /reset filters/i })).not.toBeInTheDocument();
  });

  it('shows a filtered empty state with a reset option when filters are active', async () => {
    api.get.mockResolvedValue({ data: makePage(mockEntries) });

    const user = userEvent.setup();
    render(<AdminLogs />);

    await screen.findByText(/product_created — product #12/i, {}, LOAD_TIMEOUT);

    api.get.mockResolvedValue({ data: makePage([]) });
    await user.click(screen.getByRole('button', { name: /^orders$/i }));

    await waitFor(() => {
      expect(screen.getByText(/no log entries match these filters/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);

    expect(screen.getAllByRole('button', { name: /reset filters/i }).length).toBeGreaterThan(0);
  });

  it('shows an error state if logs fail to load', async () => {
    api.get.mockRejectedValue(new Error('Network error'));

    render(<AdminLogs />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load logs/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });
});