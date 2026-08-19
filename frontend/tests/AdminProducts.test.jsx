import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Products from '../src/pages/dashboards/admin/Products';
import api from '../src/services/api';
import { useToast } from '../src/context/ToastContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
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

const mockProducts = [
  {
    id: 10,
    name: 'Titan Pro 65"',
    description: 'High-fidelity 10-point multi-touch display.',
    price: '4299.00',
    stock_qty: 12,
    is_active: true,
    category: { id: 1, name: 'Interactive Displays' },
    images: [{ id: 1, is_primary: true, url: '/img/full.webp', thumbnail_url: '/img/thumb.webp' }],
  },
  {
    id: 11,
    name: 'Apex Arm',
    description: 'Dual-pivot mount.',
    price: '849.00',
    stock_qty: 3,
    is_active: false,
    category: { id: 2, name: 'Mounts' },
    images: [],
  },
];

const mockPage = { data: mockProducts, total: 2, last_page: 1, current_page: 1 };

function renderProducts() {
  return render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>
  );
}

describe('Admin Products', () => {
  const showToast = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    useToast.mockReturnValue({ showToast });
    api.get.mockImplementation((url) => {
      if (url === '/categories') return Promise.resolve({ data: mockCategories });
      if (url === '/admin/products') return Promise.resolve({ data: mockPage });
      return Promise.resolve({ data: {} });
    });
  });

  it('loads and displays products with price, stock badge and inactive badge', async () => {
    renderProducts();

    await screen.findByText('Titan Pro 65"', {}, LOAD_TIMEOUT);
    expect(screen.getByText('Apex Arm')).toBeInTheDocument();
    expect(screen.getByText('Rs 4,299.00')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument(); // stock_qty: 3 <= threshold 5
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('filters by category via the select', async () => {
    const user = userEvent.setup();
    renderProducts();

    await screen.findByText('Titan Pro 65"', {}, LOAD_TIMEOUT);
    await user.selectOptions(screen.getByRole('combobox'), '2');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/products',
        expect.objectContaining({ params: expect.objectContaining({ category: '2' }) })
      );
    }, LOAD_TIMEOUT);
  });

  it('searches with a debounce and sends the search param', async () => {
    const user = userEvent.setup();
    renderProducts();

    await screen.findByText('Titan Pro 65"', {}, LOAD_TIMEOUT);
    api.get.mockClear();

    await user.type(screen.getByPlaceholderText(/search by name/i), 'titan');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/admin/products',
        expect.objectContaining({ params: expect.objectContaining({ search: 'titan' }) })
      );
    }, LOAD_TIMEOUT);
  });

  it('navigates to the edit page with the product passed via location state', async () => {
    const user = userEvent.setup();
    renderProducts();

    await screen.findByText('Titan Pro 65"', {}, LOAD_TIMEOUT);
    const card = screen.getByText('Titan Pro 65"').closest('div.rounded-xl');
    await user.click(within(card).getByRole('button', { name: /edit/i }));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/admin/products/10/edit',
      expect.objectContaining({ state: { product: mockProducts[0] } })
    );
  });

  it('opens a confirm dialog before deleting, and cancels without calling the API', async () => {
    const user = userEvent.setup();
    renderProducts();

    await screen.findByText('Apex Arm', {}, LOAD_TIMEOUT);
    const card = screen.getByText('Apex Arm').closest('div.rounded-xl');
    await user.click(within(card).getByTitle('Delete'));

    const dialogMessage = await screen.findByText(/delete "apex arm"/i, {}, LOAD_TIMEOUT);
    const dialog = dialogMessage.closest('div.rounded-2xl');
    await user.click(within(dialog).getByRole('button', { name: /^cancel$/i }));

    expect(screen.queryByText(/delete "apex arm"/i)).not.toBeInTheDocument();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('deletes a product after confirming, removes the card, and shows a success toast', async () => {
    api.delete.mockResolvedValueOnce({});

    const user = userEvent.setup();
    renderProducts();

    await screen.findByText('Apex Arm', {}, LOAD_TIMEOUT);
    const card = screen.getByText('Apex Arm').closest('div.rounded-xl');
    await user.click(within(card).getByTitle('Delete'));

    const dialogMessage = await screen.findByText(/delete "apex arm"/i, {}, LOAD_TIMEOUT);
    const dialog = dialogMessage.closest('div.rounded-2xl');
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/admin/products/11');
    }, LOAD_TIMEOUT);

    await waitFor(() => {
      expect(screen.queryByText('Apex Arm')).not.toBeInTheDocument();
    }, LOAD_TIMEOUT);

    expect(showToast).toHaveBeenCalledWith('Product deleted successfully.');
  });

  it('shows an error state if products fail to load', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/categories') return Promise.resolve({ data: mockCategories });
      if (url === '/admin/products') return Promise.reject(new Error('Network error'));
      return Promise.resolve({ data: {} });
    });

    renderProducts();

    await waitFor(() => {
      expect(screen.getByText(/unable to load products/i)).toBeInTheDocument();
    }, LOAD_TIMEOUT);
  });
});