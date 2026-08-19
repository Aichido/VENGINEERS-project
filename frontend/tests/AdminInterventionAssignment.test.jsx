import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InterventionAssignment from '../src/pages/dashboards/admin/InterventionAssignment';
import api from '../src/services/api';
import { useToast } from '../src/context/ToastContext';
import { fireEvent } from '@testing-library/react';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../src/context/ToastContext', () => ({
  useToast: vi.fn(),
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const mockInterventions = [
  {
    id: 80,
    public_id: '#VEN-INT-NEWX01',
    titre: 'Screen frozen',
    statut: 'nouvelle',
    priorite: 'haute',
    client: { name: 'Client A' },
    technicien: null,
    date_souhaitee: null,
  },
  {
    id: 81,
    public_id: '#VEN-INT-ASSGN2',
    titre: 'Mount broken',
    statut: 'assignee',
    priorite: 'normale',
    client: { name: 'Client B' },
    technicien: { id: 5, name: 'Julian Durand', email: 'j.durand@vengineers.com' },
    date_souhaitee: '2026-09-01',
  },
  {
    id: 82,
    public_id: '#VEN-INT-LOCKED3',
    titre: 'LiDAR issue',
    statut: 'en_cours',
    priorite: 'urgente',
    client: { name: 'Client C' },
    technicien: { id: 6, name: 'Sarah Tech', email: 's.tech@vengineers.com' },
    date_souhaitee: null,
  },
];

const mockPage = { data: mockInterventions, total: 3, last_page: 1, current_page: 1 };

const mockClients = [{ id: 50, name: 'Elena Moretti', email: 'e.moretti@vengineers.com' }];
const mockTechs = [{ id: 6, name: 'Lars Karlsson', email: 'l.karlsson@vengineers.com' }];

describe('Admin InterventionAssignment', () => {
  const showToast = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    useToast.mockReturnValue({ showToast });

    api.get.mockImplementation((url, config) => {
      if (url === '/admin/interventions') return Promise.resolve({ data: mockPage });
      if (url === '/admin/users') {
        const role = config?.params?.role;
        if (role === 'client') return Promise.resolve({ data: { data: mockClients } });
        if (role === 'technicien') return Promise.resolve({ data: { data: mockTechs } });
      }
      return Promise.resolve({ data: {} });
    });
  });

   it('loads and displays interventions with status and priority', async () => {
     render(<InterventionAssignment />);

     await screen.findByText('Screen frozen', {}, LOAD_TIMEOUT);
     expect(screen.getByText('Mount broken')).toBeInTheDocument();
     expect(screen.getByText('LiDAR issue')).toBeInTheDocument();


    const screenFrozenCard = screen.getByText('Screen frozen').closest('div.rounded-xl');
    expect(within(screenFrozenCard).getByText('New')).toBeInTheDocument();

    const mountBrokenCard = screen.getByText('Mount broken').closest('div.rounded-xl');
    expect(within(mountBrokenCard).getByText('Assigned')).toBeInTheDocument();

    const lidarCard = screen.getByText('LiDAR issue').closest('div.rounded-xl');
    expect(within(lidarCard).getByText('In progress')).toBeInTheDocument();
   });

  it('filters by status tab', async () => {
    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Screen frozen', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /^new$/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/interventions',
        expect.objectContaining({ params: expect.objectContaining({ statut: 'nouvelle' }) })
      );
    }, LOAD_TIMEOUT);
  });

  it('filters by priority via the select', async () => {
    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Screen frozen', {}, LOAD_TIMEOUT);
    await user.selectOptions(screen.getByRole('combobox'), 'haute');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/interventions',
        expect.objectContaining({ params: expect.objectContaining({ priorite: 'haute' }) })
      );
    }, LOAD_TIMEOUT);
  });

  it('shows Locked instead of an assign button for en_cours interventions', async () => {
    render(<InterventionAssignment />);

    await screen.findByText('LiDAR issue', {}, LOAD_TIMEOUT);
    const card = screen.getByText('LiDAR issue').closest('div.rounded-xl');
    expect(within(card).getByText('Locked')).toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: /assign|reassign/i })).not.toBeInTheDocument();
  });

  it('creates a new intervention for a searched client and shows a success toast', async () => {
    const created = {
      id: 90,
      public_id: '#VEN-INT-NEWONE',
      titre: 'New ticket',
      statut: 'nouvelle',
      priorite: 'normale',
      client: { name: 'Elena Moretti' },
      technicien: null,
      date_souhaitee: null,
    };
    api.post.mockResolvedValueOnce({ data: created });

    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Screen frozen', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new intervention/i }));

    const modal = screen.getByRole('heading', { name: /new intervention/i }).closest('div.rounded-2xl');

    await user.type(within(modal).getByLabelText(/client/i), 'Elena');
    const clientOption = await screen.findByText('Elena Moretti', {}, LOAD_TIMEOUT);
    await user.click(clientOption);

    await user.type(within(modal).getByLabelText(/^title$/i), 'New ticket');
    await user.type(within(modal).getByLabelText(/description/i), 'Details about the issue.');
    await user.click(within(modal).getByRole('button', { name: /create intervention/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/interventions',
        expect.objectContaining({ client_id: 50, titre: 'New ticket', description: 'Details about the issue.' })
      );
    }, LOAD_TIMEOUT);

    expect(await screen.findByText('New ticket', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith('Intervention created successfully.');
  });

  it('shows a validation message when submitting without selecting a client', async () => {
    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Screen frozen', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new intervention/i }));

    const modal = screen.getByRole('heading', { name: /new intervention/i }).closest('div.rounded-2xl');
    await user.type(within(modal).getByLabelText(/^title$/i), 'No client');
    await user.type(within(modal).getByLabelText(/description/i), 'Missing client.');
    await user.click(within(modal).getByRole('button', { name: /create intervention/i }));

    expect(await screen.findByText(/please select a client/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('assigns an unassigned intervention to a technician (encoding the public_id)', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        intervention: { ...mockInterventions[0], statut: 'assignee', technicien: mockTechs[0] },
      },
    });

    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Screen frozen', {}, LOAD_TIMEOUT);
    const card = screen.getByText('Screen frozen').closest('div.rounded-xl');
    await user.click(within(card).getByRole('button', { name: /^assign$/i }));

    const modal = screen.getByRole('heading', { name: /^assign intervention$/i }).closest('div.rounded-2xl');
    await user.type(within(modal).getByLabelText(/technician/i), 'Lars');
    const techOption = await screen.findByText('Lars Karlsson', {}, LOAD_TIMEOUT);
    await user.click(techOption);
    await user.click(within(modal).getByRole('button', { name: /^assign$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/interventions/%23VEN-INT-NEWX01/assign', {
        technicien_id: 6,
      });
    }, LOAD_TIMEOUT);

    expect(showToast).toHaveBeenCalledWith('Intervention assigned successfully.');
  });

  it('reassigns an already assigned intervention and shows a reassign-specific toast', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        intervention: { ...mockInterventions[1], technicien: mockTechs[0] },
      },
    });

    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Mount broken', {}, LOAD_TIMEOUT);
    const card = screen.getByText('Mount broken').closest('div.rounded-xl');
    await user.click(within(card).getByRole('button', { name: /^reassign$/i }));

    const modal = screen.getByRole('heading', { name: /^reassign intervention$/i }).closest('div.rounded-2xl');
    // Le technicien actuellement assigné est pré-rempli
    expect(within(modal).getByText('Julian Durand')).toBeInTheDocument();

    // Change de technicien : on efface la sélection puis recherche
    await user.click(within(modal).getByLabelText(/clear selection/i));
    await user.type(within(modal).getByLabelText(/technician/i), 'Lars');
    const techOption = await screen.findByText('Lars Karlsson', {}, LOAD_TIMEOUT);
    await user.click(techOption);
    await user.click(within(modal).getByRole('button', { name: /^reassign$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/interventions/%23VEN-INT-ASSGN2/assign', {
        technicien_id: 6,
      });
    }, LOAD_TIMEOUT);

    expect(showToast).toHaveBeenCalledWith('Intervention reassigned successfully.');
  });

  it('shows an error state if interventions fail to load', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/admin/interventions') return Promise.reject(new Error('Network error'));
      return Promise.resolve({ data: {} });
    });

    render(<InterventionAssignment />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load interventions/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });
    it('shows a generic error on a non-422 intervention creation failure', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Screen frozen', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new intervention/i }));

    const modal = screen.getByRole('heading', { name: /new intervention/i }).closest('div.rounded-2xl');
    await user.type(within(modal).getByLabelText(/client/i), 'Elena');
    const clientOption = await screen.findByText('Elena Moretti', {}, LOAD_TIMEOUT);
    await user.click(clientOption);
    await user.type(within(modal).getByLabelText(/^title$/i), 'Broken thing');
    await user.type(within(modal).getByLabelText(/description/i), 'Some description.');
    await user.click(within(modal).getByRole('button', { name: /create intervention/i }));

    expect(
      await screen.findByText(/unable to create this intervention/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('shows field-specific validation errors on a 422 intervention creation response', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 422,
         data: { errors: { date_souhaitee: ['The requested date must be in the future.'], priorite: ['Invalid priority.'] } },
      },
    });

    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Screen frozen', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new intervention/i }));

    const modal = screen.getByRole('heading', { name: /new intervention/i }).closest('div.rounded-2xl');
    await user.type(within(modal).getByLabelText(/client/i), 'Elena');
    const clientOption = await screen.findByText('Elena Moretti', {}, LOAD_TIMEOUT);
    await user.click(clientOption);
    await user.type(within(modal).getByLabelText(/^title$/i), 'Broken thing');
    await user.type(within(modal).getByLabelText(/description/i), 'Some description.');
    await user.click(within(modal).getByRole('button', { name: /create intervention/i }));

   expect(await screen.findByText(/must be in the future/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText(/invalid priority/i)).toBeInTheDocument();
  });

  it('shows the backend validation message when assignment fails with a 422 errors object', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 422,
        data: { errors: { technicien_id: ["This user doesn't have the technician role."] } },
      },
    });

    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Screen frozen', {}, LOAD_TIMEOUT);
    const card = screen.getByText('Screen frozen').closest('div.rounded-xl');
    await user.click(within(card).getByRole('button', { name: /^assign$/i }));

    const modal = screen.getByRole('heading', { name: /^assign intervention$/i }).closest('div.rounded-2xl');
    await user.type(within(modal).getByLabelText(/technician/i), 'Lars');
    const techOption = await screen.findByText('Lars Karlsson', {}, LOAD_TIMEOUT);
    await user.click(techOption);
    await user.click(within(modal).getByRole('button', { name: /^assign$/i }));

    expect(
      await screen.findByText(/doesn't have the technician role/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('shows the backend message when assignment fails with a plain message (statut blocked)', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 422,
        data: { message: "Réassignation impossible : l'intervention est au statut 'en_cours'." },
      },
    });

    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Mount broken', {}, LOAD_TIMEOUT);
    const card = screen.getByText('Mount broken').closest('div.rounded-xl');
    await user.click(within(card).getByRole('button', { name: /^reassign$/i }));

    const modal = screen.getByRole('heading', { name: /^reassign intervention$/i }).closest('div.rounded-2xl');
    await user.click(within(modal).getByRole('button', { name: /^reassign$/i }));

    expect(
      await screen.findByText(/réassignation impossible/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });

  it('shows a fallback error when submitting assignment without selecting a technician', async () => {
    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Screen frozen', {}, LOAD_TIMEOUT);
    const card = screen.getByText('Screen frozen').closest('div.rounded-xl');
    await user.click(within(card).getByRole('button', { name: /^assign$/i }));

    const modal = screen.getByRole('heading', { name: /^assign intervention$/i }).closest('div.rounded-2xl');
    await user.click(within(modal).getByRole('button', { name: /^assign$/i }));

    expect(
      await screen.findByText(/please select a technician/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
    it('lets the admin fill in equipment, priority and requested date when creating an intervention', async () => {
    const created = {
      id: 91,
      public_id: '#VEN-INT-FULLONE',
      titre: 'Full ticket',
      statut: 'nouvelle',
      priorite: 'urgente',
      client: { name: 'Elena Moretti' },
      technicien: null,
      date_souhaitee: '2026-09-15',
    };
    api.post.mockResolvedValueOnce({ data: created });

    const user = userEvent.setup();
    render(<InterventionAssignment />);

    await screen.findByText('Screen frozen', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new intervention/i }));

    const modal = screen.getByRole('heading', { name: /new intervention/i }).closest('div.rounded-2xl');
    await user.type(within(modal).getByLabelText(/client/i), 'Elena');
    const clientOption = await screen.findByText('Elena Moretti', {}, LOAD_TIMEOUT);
    await user.click(clientOption);

    await user.type(within(modal).getByLabelText(/^title$/i), 'Full ticket');
    await user.type(within(modal).getByLabelText(/description/i), 'Full details here.');
    await user.type(within(modal).getByLabelText(/equipment/i), 'Wall mount 65"');
    await user.selectOptions(within(modal).getByLabelText(/priority/i), 'urgente');

    // Champ type="date" : fireEvent.change plutôt que userEvent.type, plus fiable sur jsdom
    fireEvent.change(within(modal).getByLabelText(/requested date/i), { target: { value: '2026-09-15' } });

    await user.click(within(modal).getByRole('button', { name: /create intervention/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/interventions',
        expect.objectContaining({
          equipement: 'Wall mount 65"',
          priorite: 'urgente',
          date_souhaitee: '2026-09-15',
        })
      );
    }, LOAD_TIMEOUT);
  });
});