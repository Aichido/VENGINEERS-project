import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Users from '../src/pages/dashboards/admin/Users';
import api from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/context/ToastContext';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../src/context/ToastContext', () => ({
  useToast: vi.fn(),
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const mockCurrentAdmin = { id: 1, name: 'Admin One', role: { name: 'admin' } };

const mockUsers = [
  { id: 1, name: 'Admin One', email: 'admin@vengineers.com', role: { name: 'admin' }, is_active: true, phone: null },
  { id: 2, name: 'Sarah Mitchell', email: 's.mitchell@vengineers.com', role: { name: 'commercial' }, is_active: false, phone: '5551234' },
  { id: 3, name: 'Julian Durand', email: 'j.durand@vengineers.com', role: { name: 'technicien' }, is_active: true, phone: '5555678' },
];

const mockPage = { data: mockUsers, total: 3, last_page: 1, current_page: 1 };

const mockStats = {
  ca_total: '0.00',
  ca_mois_en_cours: '0.00',
  commandes_par_statut: {},
  interventions_ouvertes_par_priorite: {},
  utilisateurs_par_role: { commercial: 1, technicien: 1 },
};

function renderUsers() {
  return render(
    <MemoryRouter>
      <Users />
    </MemoryRouter>
  );
}

describe('Admin Users', () => {
  const showToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockCurrentAdmin });
    useToast.mockReturnValue({ showToast });

    api.get.mockImplementation((url) => {
      if (url === '/admin/stats') return Promise.resolve({ data: mockStats });
      if (url === '/admin/users') return Promise.resolve({ data: mockPage });
      return Promise.resolve({ data: {} });
    });
  });

  it('loads and displays users, excluding the currently logged-in admin', async () => {
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);
    expect(screen.getByText('Julian Durand')).toBeInTheDocument();
    expect(screen.queryByText('Admin One')).not.toBeInTheDocument();
  });

  it('displays commercial/technician counts from /admin/stats', async () => {
    renderUsers();

    await waitFor(() => {
      const commercialCard = screen.getByText('Commercial', { selector: 'p' }).closest('div').parentElement;
      expect(within(commercialCard).getByText('1', { exact: false })).toBeInTheDocument();
    }, LOAD_TIMEOUT);
    expect(api.get).toHaveBeenCalledWith('/admin/stats');
  });

  it('filters by role via the role select', async () => {
    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);

    await user.selectOptions(screen.getByRole('combobox'), 'commercial');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/users',
        expect.objectContaining({ params: expect.objectContaining({ role: 'commercial' }) })
      );
    }, LOAD_TIMEOUT);
  });

  it('searches with a debounce and sends the search param', async () => {
    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);
    api.get.mockClear();

    await user.type(screen.getByPlaceholderText(/search by name or email/i), 'sarah');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/users',
        expect.objectContaining({ params: expect.objectContaining({ search: 'sarah' }) })
      );
    }, LOAD_TIMEOUT);
  });

  it('filters client-side by Active/Inactive status', async () => {
    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);

    await user.click(screen.getByRole('button', { name: /^active$/i }));
    expect(screen.queryByText('Sarah Mitchell')).not.toBeInTheDocument(); // inactive
    expect(screen.getByText('Julian Durand')).toBeInTheDocument(); // active

    await user.click(screen.getByRole('button', { name: /^inactive$/i }));
    expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
    expect(screen.queryByText('Julian Durand')).not.toBeInTheDocument();
  });

  it('creates a new staff user and shows a success toast', async () => {
    const newUser = {
      id: 4, name: 'New Tech', email: 'new.tech@vengineers.com',
      role: { name: 'technicien' }, is_active: true, phone: null,
    };
    api.post.mockResolvedValueOnce({ data: newUser });

    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new staff user/i }));

    await user.type(screen.getByLabelText(/full name/i), 'New Tech');
    await user.type(screen.getByLabelText(/^email$/i), 'new.tech@vengineers.com');
    await user.type(screen.getByLabelText(/password/i), 'Str0ng!Pass');

    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/users',
        expect.objectContaining({ name: 'New Tech', email: 'new.tech@vengineers.com' })
      );
    }, LOAD_TIMEOUT);

    expect(await screen.findByText('New Tech', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith('User created successfully.');
  });

  it('shows field validation errors on a 422 create response', async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 422, data: { errors: { email: ['The email has already been taken.'] } } },
    });

    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new staff user/i }));

    await user.type(screen.getByLabelText(/full name/i), 'X');
    await user.type(screen.getByLabelText(/^email$/i), 'dup@vengineers.com');
    await user.type(screen.getByLabelText(/password/i), 'Str0ng!Pass');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    expect(await screen.findByText(/the email has already been taken/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });
  it('edits a user and shows the role as read-only', async () => {
    const updated = { ...mockUsers[1], name: 'Sarah M. Updated' };
    api.put.mockResolvedValueOnce({ data: updated });

    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);
    const row = screen.getByText('Sarah Mitchell').closest('tr');
    await user.click(within(row).getByTitle('Edit'));

    expect(await screen.findByText(/role cannot be changed/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
    const modalHeading = screen.getByRole('heading', { name: /edit user/i });
    const modal = modalHeading.closest('div.rounded-2xl');
    expect(within(modal).getByText('Commercial')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Sarah M. Updated');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/admin/users/2', expect.objectContaining({ name: 'Sarah M. Updated' }));
    }, LOAD_TIMEOUT);

    expect(await screen.findByText('Sarah M. Updated', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith('User updated successfully.');
  });

  it('toggles a user active/inactive', async () => {
    api.patch.mockResolvedValueOnce({ data: { ...mockUsers[1], is_active: true } });

    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);
    const row = screen.getByText('Sarah Mitchell').closest('tr');
    await user.click(within(row).getByTitle('Activate'));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/admin/users/2/toggle-active');
    }, LOAD_TIMEOUT);

    await waitFor(() => {
      expect(within(screen.getByText('Sarah Mitchell').closest('tr')).getByText('Active')).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });

  it('opens a confirm dialog before deleting, and cancels without calling the API', async () => {
    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);
    const row = screen.getByText('Sarah Mitchell').closest('tr');
    await user.click(within(row).getByTitle('Delete'));

    const dialogMessage = await screen.findByText(/delete sarah mitchell/i, {}, LOAD_TIMEOUT);
    expect(dialogMessage).toBeInTheDocument();

    const dialog = dialogMessage.closest('div.rounded-2xl');
    await user.click(within(dialog).getByRole('button', { name: /^cancel$/i }));

    expect(screen.queryByText(/delete sarah mitchell/i)).not.toBeInTheDocument();
    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
  });

  it('deletes a user after confirming, removes the row, and shows a success toast', async () => {
    api.delete.mockResolvedValueOnce({});

    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);
    const row = screen.getByText('Sarah Mitchell').closest('tr');
    await user.click(within(row).getByTitle('Delete'));

    const dialogMessage = await screen.findByText(/delete sarah mitchell/i, {}, LOAD_TIMEOUT);
    const dialog = dialogMessage.closest('div.rounded-2xl');
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/admin/users/2');
    }, LOAD_TIMEOUT);

    await waitFor(() => {
      expect(screen.queryByText('Sarah Mitchell')).not.toBeInTheDocument();
    }, LOAD_TIMEOUT);

    expect(showToast).toHaveBeenCalledWith('User deleted successfully.');
  });

  it('shows an error state if the users list fails to load', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/admin/stats') return Promise.resolve({ data: mockStats });
      if (url === '/admin/users') return Promise.reject(new Error('Network error'));
      return Promise.resolve({ data: {} });
    });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText(/unable to load users/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });
    it('lets the admin change the role option while creating a user', async () => {
    const newUser = {
      id: 5, name: 'New Admin', email: 'new.admin@vengineers.com',
      role: { name: 'admin' }, is_active: true, phone: null,
    };
    api.post.mockResolvedValueOnce({ data: newUser });

    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new staff user/i }));

    await user.selectOptions(screen.getByLabelText(/^role$/i), 'admin');
    await user.type(screen.getByLabelText(/full name/i), 'New Admin');
    await user.type(screen.getByLabelText(/^email$/i), 'new.admin@vengineers.com');
    await user.type(screen.getByLabelText(/password/i), 'Str0ng!Pass');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/users',
        expect.objectContaining({ role: 'admin' })
      );
    }, LOAD_TIMEOUT);
  });

  it('fills in optional phone and address fields on create', async () => {
    const newUser = {
      id: 6, name: 'Contact Test', email: 'contact.test@vengineers.com',
      role: { name: 'commercial' }, is_active: true, phone: '555-0000',
    };
    api.post.mockResolvedValueOnce({ data: newUser });

    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new staff user/i }));

    await user.type(screen.getByLabelText(/full name/i), 'Contact Test');
    await user.type(screen.getByLabelText(/^email$/i), 'contact.test@vengineers.com');
    await user.type(screen.getByLabelText(/password/i), 'Str0ng!Pass');
    await user.type(screen.getByLabelText(/^phone$/i), '555-0000');
    await user.type(screen.getByLabelText(/^address$/i), '12 Main Street');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/users',
        expect.objectContaining({ phone: '555-0000', address: '12 Main Street' })
      );
    }, LOAD_TIMEOUT);
  });

  it('shows a generic error message on a non-422 update failure', async () => {
    api.put.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    renderUsers();

    await screen.findByText('Sarah Mitchell', {}, LOAD_TIMEOUT);
    const row = screen.getByText('Sarah Mitchell').closest('tr');
    await user.click(within(row).getByTitle('Edit'));

    await screen.findByLabelText(/full name/i, {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText(/unable to save this user/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });
});