// Interventions.test.jsx — version finale sans le test du skeleton
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Interventions from '../src/pages/dashboards/client/Interventions';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const mockInterventionsPage1 = {
  data: [
    {
      id: 1,
      titre: "Écran ne s'allume plus",
      description: 'Plus aucune image',
      equipement: 'Écran 65"',
      date_souhaitee: '2026-08-10T00:00:00.000000Z',
      client_id: 3,
      statut: 'nouvelle',
      priorite: 'normale',
      public_id: '#VEN-INT-XEFBYHE9',
      created_at: '2026-08-06T19:43:35.000000Z',
      updated_at: '2026-08-06T19:43:35.000000Z',
    },
    {
      id: 2,
      titre: 'Problème de réseau',
      description: 'Connexion instable',
      equipement: null,
      date_souhaitee: '2026-07-15T00:00:00.000000Z',
      client_id: 3,
      statut: 'en_cours',
      priorite: 'normale',
      public_id: '#VEN-INT-ABCD1234',
      created_at: '2026-07-14T10:00:00.000000Z',
      updated_at: '2026-07-14T10:00:00.000000Z',
    },
  ],
  current_page: 1,
  last_page: 2,
};

const mockInterventionsPage2 = {
  data: [
    {
      id: 3,
      titre: 'Autre intervention',
      description: 'Description',
      equipement: 'Serveur',
      date_souhaitee: '2026-09-01T00:00:00.000000Z',
      client_id: 3,
      statut: 'terminee',
      priorite: 'normale',
      public_id: '#VEN-INT-WXYZ9876',
      created_at: '2026-08-20T10:00:00.000000Z',
      updated_at: '2026-08-20T10:00:00.000000Z',
    },
  ],
  current_page: 2,
  last_page: 2,
};

function renderInterventions(initialEntries = ['/client/interventions'], state = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: initialEntries[0], state }]}>
      <Routes>
        <Route path="/client/interventions" element={<Interventions />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Interventions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url, { params } = {}) => {
      if (url === '/client/interventions') {
        if (params?.page === 2) {
          return Promise.resolve({ data: mockInterventionsPage2 });
        }
        return Promise.resolve({ data: mockInterventionsPage1 });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('affiche "No intervention requests yet" si la liste est vide', async () => {
    api.get.mockResolvedValue({ data: { data: [], current_page: 1, last_page: 1 } });
    renderInterventions();

    await waitFor(() => {
      expect(screen.getByText(/No intervention requests yet/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
    expect(screen.getByRole('link', { name: /Submit your first request/i })).toHaveAttribute(
      'href',
      '/client/interventions/new'
    );
  });

  it('affiche une erreur si l\'appel API échoue', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderInterventions();

    await waitFor(() => {
      expect(screen.getByText("Couldn't load your intervention history. Please try again later.")).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });

  it('rend une carte avec titre, public_id, equipement (si non-null), badge statut et date', async () => {
    renderInterventions();

    await screen.findByText("Écran ne s'allume plus", {}, LOAD_TIMEOUT);

    const card1 = screen.getByText("Écran ne s'allume plus").closest('.rounded-lg.border');
    expect(card1).toBeInTheDocument();
    const withinCard1 = within(card1);
    expect(withinCard1.getByText('#VEN-INT-XEFBYHE9')).toBeInTheDocument();
    expect(withinCard1.getByText('Écran 65"')).toBeInTheDocument();
    expect(withinCard1.getByText('New')).toBeInTheDocument();
    expect(withinCard1.getByText('10 Aug 2026')).toBeInTheDocument();

    const card2 = screen.getByText('Problème de réseau').closest('.rounded-lg.border');
    expect(card2).toBeInTheDocument();
    const withinCard2 = within(card2);
    expect(withinCard2.getByText('#VEN-INT-ABCD1234')).toBeInTheDocument();
    expect(withinCard2.queryByText('Écran 65"')).not.toBeInTheDocument();
    expect(withinCard2.getByText('In progress')).toBeInTheDocument();
    expect(withinCard2.getByText('15 Jul 2026')).toBeInTheDocument();
  });

  it('le bouton "New Request" pointe vers /client/interventions/new', () => {
    renderInterventions();
    const link = screen.getByRole('link', { name: /New Request/i });
    expect(link).toHaveAttribute('href', '/client/interventions/new');
  });

  it('gère la pagination : bouton Previous désactivé en page 1', async () => {
    renderInterventions();
    await screen.findByText("Écran ne s'allume plus", {}, LOAD_TIMEOUT);

    const prevButton = screen.getByRole('button', { name: /Previous/i });
    expect(prevButton).toBeDisabled();

    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('appelle api.get avec le bon paramètre page quand on clique sur Next', async () => {
    const user = userEvent.setup();
    renderInterventions();
    await screen.findByText("Écran ne s'allume plus", {}, LOAD_TIMEOUT);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/client/interventions', { params: { page: 2 } });
    });

    await screen.findByText('Autre intervention', {}, LOAD_TIMEOUT);
    expect(screen.queryByText("Écran ne s'allume plus")).not.toBeInTheDocument();
  });

  it('désactive le bouton Next en dernière page', async () => {
    api.get.mockImplementation((url, { params } = {}) => {
      if (params?.page === 2) {
        return Promise.resolve({ data: { ...mockInterventionsPage2, last_page: 2 } });
      }
      return Promise.resolve({ data: mockInterventionsPage1 });
    });

    const user = userEvent.setup();
    renderInterventions();
    await screen.findByText("Écran ne s'allume plus", {}, LOAD_TIMEOUT);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await screen.findByText('Autre intervention', {}, LOAD_TIMEOUT);
    expect(nextButton).toBeDisabled();
  });

  it('affiche une bannière de succès si location.state.success est présent, puis nettoie le state', async () => {
    renderInterventions(['/client/interventions'], { success: 'Intervention créée avec succès !' });

    await waitFor(() => {
      expect(screen.getByText('Intervention créée avec succès !')).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });
});