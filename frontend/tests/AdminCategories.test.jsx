import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Categories from '../src/pages/dashboards/admin/Categories';
import api from '../src/services/api';
import { useToast } from '../src/context/ToastContext';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../src/context/ToastContext', () => ({
  useToast: vi.fn(),
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const mockCategories = [
  { id: 1, name: 'Interactive Displays', slug: 'interactive-displays' },
  { id: 2, name: 'Mounts', slug: 'mounts' },
];

describe('Admin Categories', () => {
  const showToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useToast.mockReturnValue({ showToast });
    api.get.mockResolvedValue({ data: mockCategories });
  });

  it('loads and displays categories', async () => {
    render(<Categories />);

    await screen.findByText('Interactive Displays', {}, LOAD_TIMEOUT);
    expect(screen.getByText('Mounts')).toBeInTheDocument();
    expect(screen.getByText('interactive-displays')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/categories');
  });

  it('creates a new category and shows a success toast', async () => {
    const newCategory = { id: 3, name: 'Sensors', slug: 'sensors' };
    api.post.mockResolvedValueOnce({ data: newCategory });

    const user = userEvent.setup();
    render(<Categories />);

    await screen.findByText('Interactive Displays', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new category/i }));

    await user.type(screen.getByLabelText(/^name$/i), 'Sensors');
    await user.click(screen.getByRole('button', { name: /create category/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/categories', { name: 'Sensors' });
    }, LOAD_TIMEOUT);

    expect(await screen.findByText('Sensors', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith('Category created successfully.');
  });

  it('sends the slug only when the user provides one', async () => {
    const newCategory = { id: 3, name: 'Sensors', slug: 'custom-slug' };
    api.post.mockResolvedValueOnce({ data: newCategory });

    const user = userEvent.setup();
    render(<Categories />);

    await screen.findByText('Interactive Displays', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new category/i }));

    await user.type(screen.getByLabelText(/^name$/i), 'Sensors');
    await user.type(screen.getByLabelText(/^slug/i), 'custom-slug');
    await user.click(screen.getByRole('button', { name: /create category/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/categories', { name: 'Sensors', slug: 'custom-slug' });
    }, LOAD_TIMEOUT);
  });

  it('shows a validation error on a 422 create response', async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 422, data: { errors: { slug: ['The slug has already been taken.'] } } },
    });

    const user = userEvent.setup();
    render(<Categories />);

    await screen.findByText('Interactive Displays', {}, LOAD_TIMEOUT);
    await user.click(screen.getByRole('button', { name: /new category/i }));

    await user.type(screen.getByLabelText(/^name$/i), 'Duplicate');
    await user.click(screen.getByRole('button', { name: /create category/i }));

    expect(await screen.findByText(/the slug has already been taken/i, {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('edits a category and shows a success toast', async () => {
    const updated = { id: 2, name: 'Wall Mounts', slug: 'mounts' };
    api.put.mockResolvedValueOnce({ data: updated });

    const user = userEvent.setup();
    render(<Categories />);

    await screen.findByText('Mounts', {}, LOAD_TIMEOUT);
    const row = screen.getByText('Mounts').closest('tr');
    await user.click(within(row).getByTitle('Edit'));

    const nameInput = await screen.findByLabelText(/^name$/i, {}, LOAD_TIMEOUT);
    expect(nameInput).toHaveValue('Mounts');
    await user.clear(nameInput);
    await user.type(nameInput, 'Wall Mounts');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/admin/categories/2', { name: 'Wall Mounts', slug: 'mounts' });
    }, LOAD_TIMEOUT);

    expect(await screen.findByText('Wall Mounts', {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith('Category updated successfully.');
  });

  it('opens a confirm dialog before deleting, and cancels without calling the API', async () => {
    const user = userEvent.setup();
    render(<Categories />);

    await screen.findByText('Mounts', {}, LOAD_TIMEOUT);
    const row = screen.getByText('Mounts').closest('tr');
    await user.click(within(row).getByTitle('Delete'));

    const dialogMessage = await screen.findByText(/delete "mounts"/i, {}, LOAD_TIMEOUT);
    const dialog = dialogMessage.closest('div.rounded-2xl');
    await user.click(within(dialog).getByRole('button', { name: /^cancel$/i }));

    expect(screen.queryByText(/delete "mounts"/i)).not.toBeInTheDocument();
    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByText('Mounts')).toBeInTheDocument();
  });

  it('deletes a category after confirming, removes the row, and shows a success toast', async () => {
    api.delete.mockResolvedValueOnce({});

    const user = userEvent.setup();
    render(<Categories />);

    await screen.findByText('Mounts', {}, LOAD_TIMEOUT);
    const row = screen.getByText('Mounts').closest('tr');
    await user.click(within(row).getByTitle('Delete'));

    const dialogMessage = await screen.findByText(/delete "mounts"/i, {}, LOAD_TIMEOUT);
    const dialog = dialogMessage.closest('div.rounded-2xl');
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/admin/categories/2');
    }, LOAD_TIMEOUT);

    await waitFor(() => {
      expect(screen.queryByText('Mounts')).not.toBeInTheDocument();
    }, LOAD_TIMEOUT);

    expect(showToast).toHaveBeenCalledWith('Category deleted successfully.');
  });

  it('shows the backend FK protection message in the dialog when deletion fails with 422', async () => {
    api.delete.mockRejectedValueOnce({
      response: { status: 422, data: { message: 'Impossible de supprimer cette catégorie : des produits y sont encore rattachés.' } },
    });

    const user = userEvent.setup();
    render(<Categories />);

    await screen.findByText('Mounts', {}, LOAD_TIMEOUT);
    const row = screen.getByText('Mounts').closest('tr');
    await user.click(within(row).getByTitle('Delete'));

    const dialogMessage = await screen.findByText(/delete "mounts"/i, {}, LOAD_TIMEOUT);
    const dialog = dialogMessage.closest('div.rounded-2xl');
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    expect(
      await screen.findByText(/des produits y sont encore rattachés/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();

    // Le dialog reste ouvert avec le message d'erreur, la catégorie n'est pas retirée
    expect(screen.getByText('Mounts')).toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('shows an error state if the categories list fails to load', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));

    render(<Categories />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load categories/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });

  it('shows an empty state when there are no categories', async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    render(<Categories />);

    await waitFor(() => {
      expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });
});