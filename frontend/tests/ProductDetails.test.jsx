import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProductDetail from '../src/pages/public/ProductDetail';
import api from '../src/services/api';
import { useCart } from '../src/context/CartContext';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../src/context/CartContext', () => ({
  useCart: vi.fn(),
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const sampleProduct = {
  id: 1,
  name: 'Elite Touch 86"',
  description: 'A premium display for executive boardrooms.',
  price: 999.99,
  created_at: new Date().toISOString(),
  category: { id: 5, name: 'Displays' },
  images: [
    { id: 1, path: 'https://picsum.photos/seed/1/800/600', is_primary: true, position: 1 },
    { id: 2, path: 'https://picsum.photos/seed/2/800/600', is_primary: false, position: 2 },
  ],
  stock_qty: 5,
};

function defaultMockImplementation(url) {
  if (/\/products\/\d+$/.test(url)) {
    return Promise.resolve({ data: sampleProduct });
  }
  if (url === '/products') {
    return Promise.resolve({ data: { data: [] } });
  }
  return Promise.resolve({ data: {} });
}

function renderProductDetail(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/products/${id}`]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProductDetail page', () => {
  const mockAddToCart = vi.fn();

  beforeEach(() => {
    api.get.mockReset();
    api.get.mockImplementation(defaultMockImplementation);
    useCart.mockReturnValue({ addToCart: mockAddToCart });
    mockAddToCart.mockReset();
  });

  // --- Tests existants (gardés) ---

  it('renders the product name, price, description and category', async () => {
    renderProductDetail();
    expect(
      await screen.findByRole('heading', { name: /elite touch 86/i }, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(screen.getByText(/rs\s*999\.99/i)).toBeInTheDocument();
    expect(
      screen.getByText('A premium display for executive boardrooms.')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Displays').length).toBeGreaterThan(0);
  });

  it('shows a NEW badge for a recently created product', async () => {
    renderProductDetail();
    await screen.findByRole('heading', { name: /elite touch 86/i }, LOAD_TIMEOUT);
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('does not show a NEW badge for an older product', async () => {
    api.get.mockImplementation((url) => {
      if (/\/products\/\d+$/.test(url)) {
        return Promise.resolve({
          data: {
            ...sampleProduct,
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    renderProductDetail();
    await screen.findByRole('heading', { name: /elite touch 86/i }, LOAD_TIMEOUT);
    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  it('switches the main image when a gallery thumbnail is clicked', async () => {
    renderProductDetail();
    await screen.findByRole('heading', { name: /elite touch 86/i }, LOAD_TIMEOUT);

    const mainImage = screen.getByAltText('Elite Touch 86"');
    expect(mainImage).toHaveAttribute('src', sampleProduct.images[0].path);

    const user = userEvent.setup();
    await user.click(screen.getByAltText(/view 2/i));

    expect(screen.getByAltText('Elite Touch 86"')).toHaveAttribute(
      'src',
      sampleProduct.images[1].path
    );
  });

  it('shows a "Product not found" message on a 404 response', async () => {
    api.get.mockImplementation((url) => {
      if (/\/products\/\d+$/.test(url)) {
        return Promise.reject({ response: { status: 404 } });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    renderProductDetail('999');

    expect(
      await screen.findByRole('heading', { name: /product not found/i }, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to products/i })).toHaveAttribute(
      'href',
      '/products'
    );
  });

  it('shows a generic error message on a non-404 failure', async () => {
    api.get.mockImplementation((url) => {
      if (/\/products\/\d+$/.test(url)) {
        return Promise.reject(new Error('Network Error'));
      }
      return Promise.resolve({ data: { data: [] } });
    });

    renderProductDetail();

    expect(
      await screen.findByText(/unable to load this product right now/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });

  it('renders related products from the same category, excluding the current product', async () => {
    const related = [
      {
        id: 2,
        name: 'Related A',
        price: 100,
        category: { id: 5, name: 'Displays' },
        images: [],
        created_at: new Date().toISOString(),
      },
      {
        id: 1,
        name: 'Should be excluded',
        price: 100,
        category: { id: 5, name: 'Displays' },
        images: [],
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Related B',
        price: 200,
        category: { id: 5, name: 'Displays' },
        images: [],
        created_at: new Date().toISOString(),
      },
    ];

    api.get.mockImplementation((url) => {
      if (/\/products\/\d+$/.test(url)) {
        return Promise.resolve({ data: sampleProduct });
      }
      if (url === '/products') {
        return Promise.resolve({ data: { data: related } });
      }
      return Promise.resolve({ data: {} });
    });

    renderProductDetail();
    await screen.findByRole('heading', { name: /elite touch 86/i }, LOAD_TIMEOUT);

    expect(await screen.findByText('Related A')).toBeInTheDocument();
    expect(await screen.findByText('Related B')).toBeInTheDocument();
    expect(screen.queryByText('Should be excluded')).not.toBeInTheDocument();

    const relatedCall = api.get.mock.calls.find(([url]) => url === '/products');
    expect(relatedCall[1].params.category).toBe(sampleProduct.category.id);
  });

  it('copies the current page URL to the clipboard when Share is clicked', async () => {
    renderProductDetail();
    await screen.findByRole('heading', { name: /elite touch 86/i }, LOAD_TIMEOUT);

    const user = userEvent.setup();
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    await user.click(screen.getByRole('button', { name: /^share$/i }));

    expect(writeTextSpy).toHaveBeenCalledWith(window.location.href);
    expect(
      await screen.findByRole('button', { name: /link copied/i })
    ).toBeInTheDocument();
  });


  it('calls addToCart with correct product when "Add to Cart" is clicked', async () => {
    const user = userEvent.setup();
    renderProductDetail();
    await screen.findByRole('heading', { name: /elite touch 86/i }, LOAD_TIMEOUT);

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    await user.click(addButton);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith({
      id: sampleProduct.id,
      name: sampleProduct.name,
      price: sampleProduct.price,
      image: sampleProduct.images[0].path,
      stock_qty: sampleProduct.stock_qty,
    });
  });

  it('disables Add to Cart button when stock is 0', async () => {
    api.get.mockImplementation((url) => {
      if (/\/products\/\d+$/.test(url)) {
        return Promise.resolve({
          data: { ...sampleProduct, stock_qty: 0 },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    renderProductDetail();
    await screen.findByRole('heading', { name: /elite touch 86/i }, LOAD_TIMEOUT);

    const button = screen.getByRole('button', { name: /out of stock/i });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Out of stock');
  });

  it('navigates to /contact when "Request a Quote" is clicked', async () => {
    renderProductDetail();
    await screen.findByRole('heading', { name: /elite touch 86/i }, LOAD_TIMEOUT);

    const quoteLink = screen.getByRole('link', { name: /request a quote/i });
    expect(quoteLink).toHaveAttribute('href', '/contact');
  });
});