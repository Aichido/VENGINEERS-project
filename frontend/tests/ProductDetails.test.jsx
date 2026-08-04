import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProductDetail from '../src/pages/public/ProductDetail';
import api from '../src/services/api';

// Mock the shared Axios instance so no real network call is made.
// ProductDetail.jsx calls GET /products/:id (main product) and, once the
// product's category is known, GET /products?category=... (related items).
vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

// ProductDetail.jsx pairs the main product fetch with an artificial 1000ms
// minimum delay (Promise.all([api.get(...), minDelay])), same pattern as
// Products.jsx. The default findBy* timeout (1000ms) races against that
// delay, so assertions waiting for the loaded state use this longer timeout.
const LOAD_TIMEOUT = { timeout: 3000 };

// Price without a thousands separator (999.99, not 1999.99) so the price
// assertion doesn't depend on locale-specific number formatting.
const sampleProduct = {
  id: 1,
  name: 'Elite Touch 86"',
  description: 'A premium display for executive boardrooms.',
  price: 999.99,
  created_at: new Date().toISOString(), // recent -> should show a NEW badge
  category: { id: 5, name: 'Displays' },
  images: [
    { id: 1, path: 'https://picsum.photos/seed/1/800/600', is_primary: true, position: 1 },
    { id: 2, path: 'https://picsum.photos/seed/2/800/600', is_primary: false, position: 2 },
  ],
};

function defaultMockImplementation(url) {
  if (/\/products\/\d+$/.test(url)) {
    return Promise.resolve({ data: sampleProduct });
  }
  if (url === '/products') {
    // Related products request — empty by default, some tests override it.
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

beforeEach(() => {
  api.get.mockReset();
  api.get.mockImplementation(defaultMockImplementation);
});

describe('ProductDetail page', () => {
  it('renders the product name, price, description and category', async () => {
    renderProductDetail();

    expect(
      await screen.findByRole('heading', { name: /elite touch 86/i }, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(screen.getByText(/rs\s*999\.99/i)).toBeInTheDocument();
    expect(
      screen.getByText('A premium display for executive boardrooms.')
    ).toBeInTheDocument();
    // "Displays" appears both in the breadcrumb and the category badge
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
        id: 1, // same id as the main product — must be filtered out
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
    // userEvent.setup() installs its own navigator.clipboard polyfill for
    // copy/paste support, which silently overwrites anything set up earlier
    // (e.g. in beforeEach). Spy on it *after* setup() runs instead.
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    await user.click(screen.getByRole('button', { name: /^share$/i }));

    expect(writeTextSpy).toHaveBeenCalledWith(window.location.href);
    expect(
      await screen.findByRole('button', { name: /link copied/i })
    ).toBeInTheDocument();
  });
});