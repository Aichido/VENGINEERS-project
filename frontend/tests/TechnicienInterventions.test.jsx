import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Interventions from '../src/pages/dashboards/technicien/Interventions';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: { get: vi.fn() },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const assignedIntervention = {
  id: 1,
  public_id: '#VEN-INT-AAA11111',
  titre: 'Touch screen calibration - Lobby kiosk',
  statut: 'assignee',
  priorite: 'haute',
  equipement: 'eBeam Edge 75"',
  date_souhaitee: '2026-08-14',
  client: { name: 'Nexus Systems' },
};

function makeInterventionsResponse(overrides = {}) {
  return {
    current_page: 1,
    last_page: 1,
    prev_page_url: null,
    next_page_url: null,
    data: [assignedIntervention],
    ...overrides,
  };
}

function renderInterventions() {
  return render(
    <MemoryRouter>
      <Interventions />
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.get.mockResolvedValue({ data: makeInterventionsResponse() });
});

describe('Technicien Interventions list', () => {
  it('renders an intervention card with title, client, priority and public_id', async () => {
    renderInterventions();

    expect(
      await screen.findByText('Touch screen calibration - Lobby kiosk', {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(screen.getByText(/Nexus Systems/)).toBeInTheDocument();
    expect(screen.getByText('haute')).toBeInTheDocument();
    expect(screen.getByText('#VEN-INT-AAA11111')).toBeInTheDocument();
  });

  it('requests the correct status filter when a tab is clicked', async () => {
    renderInterventions();
    await screen.findByText('Touch screen calibration - Lobby kiosk', {}, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'In Progress' }));

    await waitFor(() => {
      const lastCall = api.get.mock.calls.at(-1);
      expect(lastCall[1].params.statut).toBe('en_cours');
    }, LOAD_TIMEOUT);
  });

  it('links to the intervention detail page with the public_id encoded', async () => {
    renderInterventions();
    await screen.findByText('Touch screen calibration - Lobby kiosk', {}, LOAD_TIMEOUT);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/technicien/interventions/%23VEN-INT-AAA11111'
    );
  });

  it('shows an empty state when there are no interventions', async () => {
    api.get.mockResolvedValue({ data: makeInterventionsResponse({ data: [] }) });

    renderInterventions();

    expect(await screen.findByText(/no interventions found/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network error'));

    renderInterventions();

    expect(
      await screen.findByText(/unable to load interventions/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });

  it('does not render pagination when there is only one page', async () => {
    renderInterventions();
    await screen.findByText('Touch screen calibration - Lobby kiosk', {}, LOAD_TIMEOUT);

    expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('requests the next page when Next is clicked', async () => {
    api.get.mockResolvedValue({ data: makeInterventionsResponse({ last_page: 2 }) });

    renderInterventions();
    await screen.findByText('Touch screen calibration - Lobby kiosk', {}, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      const lastCall = api.get.mock.calls.at(-1);
      expect(lastCall[1].params.page).toBe(2);
    }, LOAD_TIMEOUT);
  });
});
