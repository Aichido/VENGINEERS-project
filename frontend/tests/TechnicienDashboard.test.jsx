import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TechnicienDashboard from '../src/pages/dashboards/technicien/TechnicienDashboard';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: { get: vi.fn() },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const enCoursIntervention = {
  id: 10,
  public_id: '#VEN-INT-BBB22222',
  titre: 'Server room video wall diagnostic',
  statut: 'en_cours',
  client: { name: 'Metropolis Council' },
};

// TechnicienDashboard fires 4 api.get calls on mount: 3 count calls
// (per_page: 1, distinguished by params.statut) + 1 queue call
// (statut: en_cours, per_page: 5). We branch on per_page to mock both.
function mockDashboardCalls({ assignee = 2, enCours = 1, terminee = 5, queue = [enCoursIntervention] } = {}) {
  api.get.mockImplementation((url, config) => {
    const { statut, per_page: perPage } = config.params;

    if (perPage === 1) {
      const totals = { assignee, en_cours: enCours, terminee };
      return Promise.resolve({ data: { total: totals[statut] ?? 0 } });
    }

    return Promise.resolve({ data: { data: queue } });
  });
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <TechnicienDashboard />
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  mockDashboardCalls();
});

describe('Technicien Dashboard overview', () => {
  it('renders the three status counters', async () => {
    renderDashboard();

    expect(await screen.findByText('2', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    // "In progress" apparaît deux fois sur cette page (label de la carte
    // stat + badge de statut de la file en_cours) : on tolère les deux
    // occurrences et la casse plutôt que de figer un match unique/exact.
    expect(screen.getAllByText(/in progress/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders the in-progress queue with a link to the detail page', async () => {
    renderDashboard();

    expect(
      await screen.findByText('Server room video wall diagnostic', {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(screen.getByText(/Metropolis Council/)).toBeInTheDocument();

    // Nom exact "View" pour ne pas matcher le lien "View all" du header de section.
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      '/technicien/interventions/%23VEN-INT-BBB22222'
    );
  });

  it('shows an empty state when there is no intervention in progress', async () => {
    mockDashboardCalls({ queue: [] });

    renderDashboard();

    expect(
      await screen.findByText(/no intervention currently in progress/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });

  it('shows an error state when a request fails', async () => {
    api.get.mockReset();
    api.get.mockRejectedValue(new Error('network error'));

    renderDashboard();

    expect(
      await screen.findByText(/unable to load your dashboard/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });
});