import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '../src/pages/dashboards/admin/AdminDashboard';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const mockStats = {
  ca_total: '45000.00',
  ca_mois_en_cours: '8200.50',
  commandes_par_statut: { en_attente: 3, validee: 5, expediee: 2, livree: 10, annulee: 1 },
  interventions_ouvertes_par_priorite: { basse: 1, normale: 4, haute: 2, urgente: 1 },
  utilisateurs_par_role: { admin: 1, commercial: 3, technicien: 5, client: 20 },
};

const mockNotificationsPage = {
  data: [
    {
      id: 'a1b2c3',
      data: { message: 'Stock bas signalé pour « Titan Pro 65" » (2 restant(s)).' },
      read_at: null,
      created_at: '2026-08-18T10:00:00.000000Z',
    },
    {
      id: 'd4e5f6',
      data: { message: 'Stock bas signalé pour « Apex Arm » (1 restant(s)).' },
      read_at: '2026-08-17T09:00:00.000000Z',
      created_at: '2026-08-17T08:00:00.000000Z',
    },
  ],
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.get.mockImplementation((url) => {
      if (url === '/admin/stats') return Promise.resolve({ data: mockStats });
      if (url === '/admin/notifications') return Promise.resolve({ data: mockNotificationsPage });
      return Promise.resolve({ data: {} });
    });
  });

  it('loads and displays the revenue KPIs', async () => {
    render(<AdminDashboard />);

    await screen.findByText('Overview', {}, LOAD_TIMEOUT);
    expect(screen.getByText('Rs 45,000.00')).toBeInTheDocument();
    expect(screen.getByText('Rs 8,200.50')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/admin/stats');
  });

  it('displays orders by status with correct counts', async () => {
    render(<AdminDashboard />);

    await screen.findByText('Orders by Status', {}, LOAD_TIMEOUT);
    const section = screen.getByText('Orders by Status').closest('div.rounded-xl');

    expect(within(section).getByText('Pending')).toBeInTheDocument();
    expect(within(section).getByText('3')).toBeInTheDocument();
    expect(within(section).getByText('Delivered')).toBeInTheDocument();
    expect(within(section).getByText('10')).toBeInTheDocument();
  });

  it('displays open interventions by priority', async () => {
    render(<AdminDashboard />);

    await screen.findByText('Open Interventions by Priority', {}, LOAD_TIMEOUT);
    const section = screen.getByText('Open Interventions by Priority').closest('div.rounded-xl');

    expect(within(section).getByText('Urgent')).toBeInTheDocument();
    expect(within(section).getByText('High')).toBeInTheDocument();
    expect(within(section).getByText('4')).toBeInTheDocument(); // normale
  });

  it('displays users by role', async () => {
    render(<AdminDashboard />);

    await screen.findByText('Users by Role', {}, LOAD_TIMEOUT);
    const section = screen.getByText('Users by Role').closest('div.rounded-xl');

    expect(within(section).getByText('Client')).toBeInTheDocument();
    expect(within(section).getByText('20')).toBeInTheDocument();
    expect(within(section).getByText('Technicien')).toBeInTheDocument();
  });

  it('shows a default of 0 for missing statuses/priorities/roles', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/admin/stats') {
        return Promise.resolve({
          data: {
            ca_total: '0.00',
            ca_mois_en_cours: '0.00',
            commandes_par_statut: {},
            interventions_ouvertes_par_priorite: {},
            utilisateurs_par_role: {},
          },
        });
      }
      if (url === '/admin/notifications') return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: {} });
    });

    render(<AdminDashboard />);

    await screen.findByText('Orders by Status', {}, LOAD_TIMEOUT);
    const section = screen.getByText('Orders by Status').closest('div.rounded-xl');
    expect(within(section).getAllByText('0').length).toBeGreaterThan(0);
  });

  it('loads and displays notifications with unread count', async () => {
    render(<AdminDashboard />);

    await screen.findByText(/stock bas signalé pour « titan pro 65" »/i, {}, LOAD_TIMEOUT);
    expect(screen.getByText(/stock bas signalé pour « apex arm »/i)).toBeInTheDocument();
    expect(screen.getByText('1 unread')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/admin/notifications');
  });

  it('marks a notification as read and updates the UI', async () => {
    api.patch.mockResolvedValueOnce({ data: { message: 'Notification marquée comme lue.' } });

    const user = userEvent.setup();
    render(<AdminDashboard />);

    await screen.findByText(/stock bas signalé pour « titan pro 65" »/i, {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /mark as read/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/admin/notifications/a1b2c3/read');
    }, LOAD_TIMEOUT);

    await waitFor(() => {
      expect(screen.queryByText('1 unread')).not.toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });

  it('shows an empty state when there are no notifications', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/admin/stats') return Promise.resolve({ data: mockStats });
      if (url === '/admin/notifications') return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: {} });
    });

    render(<AdminDashboard />);

    expect(await screen.findByText(/^no notifications\.$/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
  });

  it('shows an error state if stats fail to load', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/admin/stats') return Promise.reject(new Error('Network error'));
      if (url === '/admin/notifications') return Promise.resolve({ data: mockNotificationsPage });
      return Promise.resolve({ data: {} });
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load dashboard statistics/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });
});