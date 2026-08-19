import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProductForm from '../src/pages/dashboards/admin/ProductForm';
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
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../src/context/ToastContext', () => ({
  useToast: vi.fn(),
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const mockCategories = [
  { id: 1, name: 'Interactive Displays' },
  { id: 2, name: 'Mounts' },
];

const mockProduct = {
  id: 10,
  name: 'Titan Pro 65"',
  description: 'High-fidelity display.',
  price: '4299.00',
  stock_qty: 12,
  category_id: 1,
  category: { id: 1, name: 'Interactive Displays' },
  is_active: true,
  images: [
    { id: 1, is_primary: true, position: 0, url: '/img/1-full.webp', thumbnail_url: '/img/1-thumb.webp' },
    { id: 2, is_primary: false, position: 1, url: '/img/2-full.webp', thumbnail_url: '/img/2-thumb.webp' },
  ],
};

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={['/admin/products/new']}>
      <Routes>
        <Route path="/admin/products/new" element={<ProductForm />} />
        <Route path="/admin/products/:id/edit" element={<ProductForm />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderEdit(product = mockProduct) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/admin/products/${product.id}/edit`, state: { product } }]}>
      <Routes>
        <Route path="/admin/products/new" element={<ProductForm />} />
        <Route path="/admin/products/:id/edit" element={<ProductForm />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderEditWithoutState(id = '99') {
  return render(
    <MemoryRouter initialEntries={[`/admin/products/${id}/edit`]}>
      <Routes>
        <Route path="/admin/products/new" element={<ProductForm />} />
        <Route path="/admin/products/:id/edit" element={<ProductForm />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Admin ProductForm', () => {
  const showToast = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    useToast.mockReturnValue({ showToast });
    api.get.mockResolvedValue({ data: mockCategories });
  });

  it('shows a fallback message when editing without a product in location state', async () => {
    renderEditWithoutState();

    expect(
      await screen.findByText(/couldn't be loaded directly/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to product catalog/i })).toBeInTheDocument();
  });

  it('creates a product, then switches into edit mode and shows the image gallery', async () => {
    const created = { ...mockProduct, id: 20, images: [] };
    api.post.mockResolvedValueOnce({ data: created });

    const user = userEvent.setup();
    renderCreate();

    await screen.findByText('New Product', {}, LOAD_TIMEOUT);

    await user.type(screen.getByLabelText(/^name$/i), 'Titan Pro 65"');
    await user.type(screen.getByLabelText(/price/i), '4299');
    await user.type(screen.getByLabelText(/stock quantity/i), '12');
    await user.selectOptions(screen.getByLabelText(/category/i), '1');
    await user.click(screen.getByRole('button', { name: /create product/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/products',
        expect.objectContaining({ name: 'Titan Pro 65"', category_id: '1' })
      );
    }, LOAD_TIMEOUT);

    expect(showToast).toHaveBeenCalledWith('Product created successfully.');
    expect(mockNavigate).toHaveBeenCalledWith(
      '/admin/products/20/edit',
      expect.objectContaining({ state: { product: created }, replace: true })
    );
  });

  it('shows field validation errors on a 422 create response', async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 422, data: { errors: { name: ['This product name is already taken.'] } } },
    });

    const user = userEvent.setup();
    renderCreate();

    await screen.findByText('New Product', {}, LOAD_TIMEOUT);
    await user.type(screen.getByLabelText(/^name$/i), 'Duplicate Product');
    await user.type(screen.getByLabelText(/price/i), '100');
    await user.type(screen.getByLabelText(/stock quantity/i), '5');
    await user.selectOptions(screen.getByLabelText(/category/i), '1');
    await user.click(screen.getByRole('button', { name: /create product/i }));

    expect(
      await screen.findByText(/this product name is already taken/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('pre-fills the form and updates an existing product', async () => {
    const updated = { ...mockProduct, name: 'Titan Pro 65" Gen 2' };
    api.put.mockResolvedValueOnce({ data: updated });

    const user = userEvent.setup();
    renderEdit();

    const nameInput = await screen.findByLabelText(/^name$/i, {}, LOAD_TIMEOUT);
    expect(nameInput).toHaveValue('Titan Pro 65"');
    expect(screen.getByLabelText(/price/i)).toHaveValue(4299);

    await user.clear(nameInput);
    await user.type(nameInput, 'Titan Pro 65" Gen 2');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/admin/products/10',
        expect.objectContaining({ name: 'Titan Pro 65" Gen 2' })
      );
    }, LOAD_TIMEOUT);

    expect(showToast).toHaveBeenCalledWith('Product updated successfully.');
  });

  it('shows the image gallery with the primary badge in edit mode', async () => {
    renderEdit();

    await screen.findByText(/product images \(2\/5\)/i, {}, LOAD_TIMEOUT);
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('uploads a new image via the gallery', async () => {
    const newImage = { id: 3, is_primary: false, position: 2, url: '/img/3-full.webp', thumbnail_url: '/img/3-thumb.webp' };
    api.post.mockResolvedValueOnce({ data: newImage });

    const user = userEvent.setup();
    renderEdit();

    await screen.findByText(/product images \(2\/5\)/i, {}, LOAD_TIMEOUT);

    const file = new File(['fake-image-content'], 'photo.webp', { type: 'image/webp' });
    const fileInput = document.querySelector('input[type="file"]');
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/products/10/images',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      );
    }, LOAD_TIMEOUT);

    await screen.findByText(/product images \(3\/5\)/i, {}, LOAD_TIMEOUT);
  });

  it('sets a non-primary image as primary', async () => {
    const reordered = [
      { ...mockProduct.images[1], is_primary: true },
      { ...mockProduct.images[0], is_primary: false },
    ];
    api.patch.mockResolvedValueOnce({ data: reordered });

    const user = userEvent.setup();
    renderEdit();

    await screen.findByText(/product images \(2\/5\)/i, {}, LOAD_TIMEOUT);
    await user.click(screen.getByTitle('Set as primary'));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/admin/products/10/images/2/set-primary');
    }, LOAD_TIMEOUT);
  });

  it('deletes an image from the gallery', async () => {
    api.delete.mockResolvedValueOnce({});

    const user = userEvent.setup();
    renderEdit();

    await screen.findByText(/product images \(2\/5\)/i, {}, LOAD_TIMEOUT);
    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/admin/products/10/images/1');
    }, LOAD_TIMEOUT);

    await screen.findByText(/product images \(1\/5\)/i, {}, LOAD_TIMEOUT);
  });

  it('reorders images using the arrow buttons', async () => {
    const reordered = [
      { ...mockProduct.images[1], position: 0 },
      { ...mockProduct.images[0], position: 1 },
    ];
    api.patch.mockResolvedValueOnce({ data: reordered });

    const user = userEvent.setup();
    renderEdit();

    await screen.findByText(/product images \(2\/5\)/i, {}, LOAD_TIMEOUT);
    const moveRightButtons = screen.getAllByTitle('Move right');
    await user.click(moveRightButtons[0]);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/admin/products/10/images/reorder', { image_ids: [2, 1] });
    }, LOAD_TIMEOUT);
  });
    it('shows the backend message when an image upload fails with 422', async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 422, data: { message: 'Maximum of 5 images already reached.' } },
    });

    const user = userEvent.setup();
    renderEdit();

    await screen.findByText(/product images \(2\/5\)/i, {}, LOAD_TIMEOUT);

    const file = new File(['fake-image-content'], 'photo.webp', { type: 'image/webp' });
    const fileInput = document.querySelector('input[type="file"]');
    await user.upload(fileInput, file);

    expect(
      await screen.findByText(/maximum of 5 images already reached/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    // Le compteur ne doit pas avoir avancé
    expect(screen.getByText(/product images \(2\/5\)/i)).toBeInTheDocument();
  });

  it('shows a generic error on a non-422 upload failure', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    renderEdit();

    await screen.findByText(/product images \(2\/5\)/i, {}, LOAD_TIMEOUT);

    const file = new File(['fake-image-content'], 'photo.webp', { type: 'image/webp' });
    const fileInput = document.querySelector('input[type="file"]');
    await user.upload(fileInput, file);

    expect(
      await screen.findByText(/unable to upload this image/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });

  it('shows an error when deleting an image fails', async () => {
    api.delete.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    renderEdit();

    await screen.findByText(/product images \(2\/5\)/i, {}, LOAD_TIMEOUT);
    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    expect(
      await screen.findByText(/unable to delete this image/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    // L'image reste affichée puisque la suppression a échoué
    expect(screen.getByText(/product images \(2\/5\)/i)).toBeInTheDocument();
  });

  it('shows an error when setting an image as primary fails', async () => {
    api.patch.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    renderEdit();

    await screen.findByText(/product images \(2\/5\)/i, {}, LOAD_TIMEOUT);
    await user.click(screen.getByTitle('Set as primary'));

    expect(
      await screen.findByText(/unable to set this image as primary/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });

  it('shows an error when reordering images fails', async () => {
    api.patch.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    renderEdit();

    await screen.findByText(/product images \(2\/5\)/i, {}, LOAD_TIMEOUT);
    const moveRightButtons = screen.getAllByTitle('Move right');
    await user.click(moveRightButtons[0]);

    expect(
      await screen.findByText(/unable to reorder images/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });

  it('disables the upload button once the 5-image limit is reached', async () => {
    const fullProduct = {
      ...mockProduct,
      images: [
        ...mockProduct.images,
        { id: 3, is_primary: false, position: 2, url: '/img/3.webp', thumbnail_url: '/img/3-t.webp' },
        { id: 4, is_primary: false, position: 3, url: '/img/4.webp', thumbnail_url: '/img/4-t.webp' },
        { id: 5, is_primary: false, position: 4, url: '/img/5.webp', thumbnail_url: '/img/5-t.webp' },
      ],
    };

    renderEdit(fullProduct);

    await screen.findByText(/product images \(5\/5\)/i, {}, LOAD_TIMEOUT);
    expect(screen.getByRole('button', { name: /upload image/i })).toBeDisabled();
  });
});