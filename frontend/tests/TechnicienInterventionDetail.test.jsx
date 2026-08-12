import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import InterventionDetail from '../src/pages/dashboards/technicien/InterventionDetail';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));

const LOAD_TIMEOUT = { timeout: 3000 };
const PUBLIC_ID = '#VEN-INT-AAA11111';

function makeIntervention(overrides = {}) {
  return {
    id: 1,
    public_id: PUBLIC_ID,
    titre: 'Touch screen calibration - Lobby kiosk',
    description: 'Screen misaligned after last firmware update.',
    equipement: 'eBeam Edge 75"',
    priorite: 'haute',
    date_souhaitee: '2026-08-14',
    statut: 'assignee',
    client: { name: 'Nexus Systems', email: 'contact@nexus.test' },
    reports: [],
    ...overrides,
  };
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={[`/technicien/interventions/${encodeURIComponent(PUBLIC_ID)}`]}>
      <Routes>
        <Route path="/technicien/interventions/:publicId" element={<InterventionDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.put.mockReset();
  api.post.mockReset();
});

describe('Technicien InterventionDetail page', () => {
  it('renders the job summary', async () => {
    api.get.mockResolvedValue({ data: makeIntervention() });

    renderDetail();

    expect(
      await screen.findByText('Touch screen calibration - Lobby kiosk', {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(screen.getByText(/Nexus Systems/)).toBeInTheDocument();
    expect(screen.getByText('eBeam Edge 75"')).toBeInTheDocument();
    expect(screen.getByText('Screen misaligned after last firmware update.')).toBeInTheDocument();
  });

  it('starts the intervention and refreshes the status badge', async () => {
    api.get.mockResolvedValue({ data: makeIntervention() });
    api.put.mockResolvedValue({ data: makeIntervention({ statut: 'en_cours' }) });

    renderDetail();
    await screen.findByText('Touch screen calibration - Lobby kiosk', {}, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Start intervention' }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        `/technicien/interventions/${encodeURIComponent(PUBLIC_ID)}`,
        { statut: 'en_cours' }
      );
    }, LOAD_TIMEOUT);

    expect(await screen.findByText('In progress', {}, LOAD_TIMEOUT)).toBeInTheDocument();
  });

  it('shows the report form once the intervention is in progress', async () => {
    api.get.mockResolvedValue({ data: makeIntervention({ statut: 'en_cours' }) });

    renderDetail();

    expect(await screen.findByText('Submit intervention report', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark as completed' })).toBeInTheDocument();
  });

  it('shows the backend 422 message when closing without a report', async () => {
    api.get.mockResolvedValue({ data: makeIntervention({ statut: 'en_cours' }) });
    api.put.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: { statut: ['A report must be submitted before closing the intervention.'] } },
      },
    });

    renderDetail();
    await screen.findByText('Submit intervention report', {}, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Mark as completed' }));

    expect(
      await screen.findByText(/a report must be submitted before closing/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });

  it('lists previously submitted reports', async () => {
    api.get.mockResolvedValue({
      data: makeIntervention({
        statut: 'terminee',
        reports: [
          { id: 5, contenu: 'All good, no anomalies found.', created_at: '2026-08-10T10:00:00.000000Z' },
        ],
      }),
    });

    renderDetail();

    expect(await screen.findByText('Submitted reports', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('All good, no anomalies found.')).toBeInTheDocument();
  });

  it('does not show any action button on a completed intervention', async () => {
    api.get.mockResolvedValue({ data: makeIntervention({ statut: 'terminee' }) });

    renderDetail();
    await screen.findByText('Touch screen calibration - Lobby kiosk', {}, LOAD_TIMEOUT);

    expect(screen.queryByRole('button', { name: 'Start intervention' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark as completed' })).not.toBeInTheDocument();
  });

  it('shows a 404 message and a back link when the intervention does not exist', async () => {
    api.get.mockRejectedValue({ response: { status: 404 } });

    renderDetail();

    expect(await screen.findByText('Intervention not found.', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to interventions/i })).toHaveAttribute(
      'href',
      '/technicien/interventions'
    );
  });

  it('shows a generic error message on a non-404 failure', async () => {
    api.get.mockRejectedValue({ response: { status: 500 } });

    renderDetail();

    expect(
      await screen.findByText('Unable to load this intervention.', {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });
});
