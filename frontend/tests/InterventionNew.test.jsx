// InterventionNew.test.jsx — version corrigée
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import InterventionNew from '../src/pages/dashboards/client/InterventionNew';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});


function renderInterventionNew() {
  return render(
    <MemoryRouter initialEntries={['/client/interventions/new']}>
      <Routes>
        <Route path="/client/interventions/new" element={<InterventionNew />} />
        <Route path="/client/interventions" element={<div>Interventions list</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('InterventionNew', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockReset();
  });

  it('renders the four fields: Title (required), Equipment (optional), Preferred Date (optional), Description (required)', () => {
    renderInterventionNew();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Equipment concerned/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Problem Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Request/i })).toBeInTheDocument();
  });

  it('submits the form with correct payload (null for empty optional fields) and navigates on success', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: {} });

    renderInterventionNew();

    await user.type(screen.getByLabelText(/Title/i), 'Screen flickering');
    await user.type(screen.getByLabelText(/Equipment concerned/i), 'Monitor 42"');
    // date is left empty
    await user.type(screen.getByLabelText(/Problem Description/i), 'The screen flickers randomly.');

    await user.click(screen.getByRole('button', { name: /Send Request/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/client/interventions', {
        titre: 'Screen flickering',
        equipement: 'Monitor 42"',
        date_souhaitee: null,
        description: 'The screen flickers randomly.',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/client/interventions', {
      state: {
        success: expect.stringContaining('Your request has been submitted.'),
      },
    });
  });

  it('sends equipement and date as null when fields are empty', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: {} });

    renderInterventionNew();

    await user.type(screen.getByLabelText(/Title/i), 'Test');
    await user.type(screen.getByLabelText(/Problem Description/i), 'Test description');
    // équipement and date left empty

    await user.click(screen.getByRole('button', { name: /Send Request/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/client/interventions', {
        titre: 'Test',
        equipement: null,
        date_souhaitee: null,
        description: 'Test description',
      });
    });
  });

  it('displays 422 field errors per field', async () => {
    const user = userEvent.setup();
    const errorResponse = {
      response: {
        status: 422,
        data: {
          errors: {
            titre: ['The title field is required.'],
            description: ['The description field is required.'],
          },
        },
      },
    };
    api.post.mockRejectedValueOnce(errorResponse);

    renderInterventionNew();

    // Remplir les champs requis pour que le formulaire soit soumis (browser validation)
    await user.type(screen.getByLabelText(/Title/i), 'Test');
    await user.type(screen.getByLabelText(/Problem Description/i), 'Test description');

    await user.click(screen.getByRole('button', { name: /Send Request/i }));

    await waitFor(() => {
      expect(screen.getByText('The title field is required.')).toBeInTheDocument();
      expect(screen.getByText('The description field is required.')).toBeInTheDocument();
    });
    // Pas d'erreur générale
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
  });

  it('displays a general error for non-422 failures', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce(new Error('Network error'));

    renderInterventionNew();

    await user.type(screen.getByLabelText(/Title/i), 'Test');
    await user.type(screen.getByLabelText(/Problem Description/i), 'Test');
    await user.click(screen.getByRole('button', { name: /Send Request/i }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  it('disables the submit button and shows "Sending..." while submitting', async () => {
    const user = userEvent.setup();
    // Simuler une requête lente
    api.post.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 500)));

    renderInterventionNew();

    await user.type(screen.getByLabelText(/Title/i), 'Test');
    await user.type(screen.getByLabelText(/Problem Description/i), 'Test');
    const submitButton = screen.getByRole('button', { name: /Send Request/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Sending...');

    // Attendre la fin de la requête
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
    // Le navigateur redirige, on ne vérifie pas le retour à l'état normal.
  });

  it('the "Back to interventions" link points to /client/interventions', () => {
    renderInterventionNew();
    const link = screen.getByRole('link', { name: /Back to interventions/i });
    expect(link).toHaveAttribute('href', '/client/interventions');
  });
});