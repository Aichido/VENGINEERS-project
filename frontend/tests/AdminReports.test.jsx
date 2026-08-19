import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Reports from '../src/pages/dashboards/admin/Reports';
import api from '../src/services/api';
import { useToast } from '../src/context/ToastContext';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../src/context/ToastContext', () => ({
  useToast: vi.fn(),
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const mockInterventions = [
  {
    id: 30,
    public_id: '#VEN-INT-DONE001',
    titre: 'Broken touchscreen',
    statut: 'terminee',
    client: { name: 'Client A' },
    technicien: { name: 'Julian Durand' },
  },
];

const mockPage = { data: mockInterventions, total: 1, last_page: 1, current_page: 1 };

const mockReports = [
  {
    id: 1,
    fichier_path: 'reports/30/report-1.pdf',
    contenu: 'Replaced the display panel.',
    created_at: '2026-08-10T10:00:00.000000Z',
    technicien: { name: 'Julian Durand' },
  },
];

describe('Admin Reports', () => {
  const showToast = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    useToast.mockReturnValue({ showToast });

    api.get.mockImplementation((url) => {
      if (url === '/admin/interventions') return Promise.resolve({ data: mockPage });
      if (url === '/admin/interventions/%23VEN-INT-DONE001/reports') return Promise.resolve({ data: mockReports });
      return Promise.resolve({ data: {} });
    });
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('loads and displays completed interventions by default', async () => {
    render(<Reports />);

    await screen.findByText('Broken touchscreen', {}, LOAD_TIMEOUT);
    expect(api.get).toHaveBeenCalledWith(
      '/admin/interventions',
      expect.objectContaining({ params: expect.objectContaining({ statut: 'terminee' }) })
    );
  });

  it('expands an intervention and fetches its reports', async () => {
    const user = userEvent.setup();
    render(<Reports />);

    await screen.findByText('Broken touchscreen', {}, LOAD_TIMEOUT);
    await user.click(screen.getByText('Broken touchscreen'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/admin/interventions/%23VEN-INT-DONE001/reports');
    }, LOAD_TIMEOUT);

    expect(await screen.findByText(/report by julian durand/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('Replaced the display panel.')).toBeInTheDocument();
  });

  it('shows a message when an intervention has no reports', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/admin/interventions') return Promise.resolve({ data: mockPage });
      if (url === '/admin/interventions/%23VEN-INT-DONE001/reports') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });

    const user = userEvent.setup();
    render(<Reports />);

    await screen.findByText('Broken touchscreen', {}, LOAD_TIMEOUT);
    await user.click(screen.getByText('Broken touchscreen'));

    expect(
      await screen.findByText(/no reports uploaded for this intervention yet/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });

  it('downloads a report as a blob using the encoded public_id', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/admin/interventions') return Promise.resolve({ data: mockPage });
      if (url === '/admin/interventions/%23VEN-INT-DONE001/reports') return Promise.resolve({ data: mockReports });
      if (url === '/interventions/%23VEN-INT-DONE001/reports/1/download') {
        return Promise.resolve({ data: new Blob(['fake-pdf-content']) });
      }
      return Promise.resolve({ data: {} });
    });

    const user = userEvent.setup();
    render(<Reports />);

    await screen.findByText('Broken touchscreen', {}, LOAD_TIMEOUT);
    await user.click(screen.getByText('Broken touchscreen'));
    await screen.findByText(/report by julian durand/i, {}, LOAD_TIMEOUT);

    await user.click(screen.getByRole('button', { name: /download/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/interventions/%23VEN-INT-DONE001/reports/1/download',
        { responseType: 'blob' }
      );
    }, LOAD_TIMEOUT);

  expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it('shows an error toast if a report download fails', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/admin/interventions') return Promise.resolve({ data: mockPage });
      if (url === '/admin/interventions/%23VEN-INT-DONE001/reports') return Promise.resolve({ data: mockReports });
      if (url === '/interventions/%23VEN-INT-DONE001/reports/1/download') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ data: {} });
    });

    const user = userEvent.setup();
    render(<Reports />);

    await screen.findByText('Broken touchscreen', {}, LOAD_TIMEOUT);
    await user.click(screen.getByText('Broken touchscreen'));
    await screen.findByText(/report by julian durand/i, {}, LOAD_TIMEOUT);

    await user.click(screen.getByRole('button', { name: /download/i }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Unable to download this report.', 'error');
    }, LOAD_TIMEOUT);
  });

  it('switches status tab and refetches interventions', async () => {
    const user = userEvent.setup();
    render(<Reports />);

    await screen.findByText('Broken touchscreen', {}, LOAD_TIMEOUT);
    api.get.mockClear();
    api.get.mockImplementation((url) => {
      if (url === '/admin/interventions') return Promise.resolve({ data: { data: [], total: 0, last_page: 1 } });
      return Promise.resolve({ data: {} });
    });

    await user.click(screen.getByRole('button', { name: /^in progress$/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/interventions',
        expect.objectContaining({ params: expect.objectContaining({ statut: 'en_cours' }) })
      );
    }, LOAD_TIMEOUT);
  });

  it('shows an error state if interventions fail to load', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/admin/interventions') return Promise.reject(new Error('Network error'));
      return Promise.resolve({ data: {} });
    });

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load interventions/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });
});