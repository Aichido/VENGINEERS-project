import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportHistory from '../src/pages/dashboards/technicien/ReportHistory';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: { get: vi.fn() },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const report = {
  id: 5,
  contenu: 'Optics cleaned and recalibrated. No anomalies found.',
  fichier_path: 'intervention-reports/report.pdf',
  created_at: '2026-08-10T10:00:00.000000Z',
  intervention: { public_id: '#VEN-INT-AAA11111', titre: 'Routine optics cleaning' },
};

function makeReportsResponse(overrides = {}) {
  return {
    current_page: 1,
    last_page: 1,
    data: [report],
    ...overrides,
  };
}

function renderHistory() {
  return render(
    <MemoryRouter>
      <ReportHistory />
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.get.mockResolvedValue({ data: makeReportsResponse() });
});

describe('Technicien Report History page', () => {
  it('renders a report row with intervention title, findings excerpt and attached file', async () => {
    renderHistory();

    expect(await screen.findByText('Routine optics cleaning', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText(/optics cleaned and recalibrated/i)).toBeInTheDocument();
    expect(screen.getByText('Attached')).toBeInTheDocument();
  });

  it('links to the related intervention detail page', async () => {
    renderHistory();
    await screen.findByText('Routine optics cleaning', {}, LOAD_TIMEOUT);

    expect(screen.getByRole('link', { name: /view/i })).toHaveAttribute(
      'href',
      '/technicien/interventions/%23VEN-INT-AAA11111'
    );
  });

  it('shows a dash when no file was attached', async () => {
    api.get.mockResolvedValue({
      data: makeReportsResponse({ data: [{ ...report, fichier_path: null }] }),
    });

    renderHistory();
    await screen.findByText('Routine optics cleaning', {}, LOAD_TIMEOUT);

    expect(screen.queryByText('Attached')).not.toBeInTheDocument();
  });

  it('shows an empty state when there is no report yet', async () => {
    api.get.mockResolvedValue({ data: makeReportsResponse({ data: [] }) });

    renderHistory();

    expect(await screen.findByText(/no report submitted yet/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network error'));

    renderHistory();

    expect(
      await screen.findByText(/unable to load your report history/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });
});
