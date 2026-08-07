// Products.test.jsx — corrigé (dernier test avec le lien "Details →")
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Products from '../src/pages/public/Products';
import api from '../src/services/api';
import { CartProvider } from '../src/context/CartContext';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const LOAD_TIMEOUT = { timeout: 3000 };

const sampleCategories = [
  { id: 1, name: 'Touchscreens' },
  { id: 2, name: 'Networking' },
];

const sampleProducts = [
  {
    id: 1,
    name: 'Product A',
    description: 'Description A',
    price: 1000,
    category: { id: 1, name: 'Touchscreens' },
    images: [],
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Product B',
    description: 'Description B',
    price: 2000,
    category: { id: 2, name: 'Networking' },
    images: [],
    created_at: new Date().toISOString(),
  },
];

function defaultMockImplementation(url) {
  if (url === '/categories') {
    return Promise.resolve({ data: { data: sampleCategories } });
  }
  if (url === '/products') {
    return Promise.resolve({
      data: { data: sampleProducts, last_page: 1, total: sampleProducts.length },
    });
  }
  return Promise.resolve({ data: {} });
}

function getProductsCalls() {
  return api.get.mock.calls.filter(([url]) => url === '/products');
}

function renderProducts() {
  return render(
    <MemoryRouter>
      <CartProvider>
        <Products />
      </CartProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.get.mockImplementation(defaultMockImplementation);
});

describe('Products page', () => {
  it('renders the hero heading and eventually shows the product count', async () => {
    renderProducts();
    expect(
      screen.getByRole('heading', {
        name: /cutting-edge technology at your fingertips/i,
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/2 products/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();
  });

  it('lets the user filter by category', async () => {
    renderProducts();
    await screen.findByText(/2 products/i, {}, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /filters/i }));

    const categoryButton = await screen.findByRole('button', { name: 'Touchscreens' });
    await user.click(categoryButton);

    await waitFor(
      () => {
        const lastCall = getProductsCalls().at(-1);
        expect(lastCall[1].params.category).toBe(1);
      },
      LOAD_TIMEOUT
    );
  });

  it('debounces the search input and requests products filtered by the search term', async () => {
    renderProducts();
    await screen.findByText(/2 products/i, {}, LOAD_TIMEOUT);

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/search for a product/i);
    await user.type(searchInput, 'touchscreen');

    await waitFor(
      () => {
        const lastCall = getProductsCalls().at(-1);
        expect(lastCall[1].params.search).toBe('touchscreen');
      },
      { timeout: 3000 }
    );
  });

  it('only applies the price range after clicking Apply, not while dragging', async () => {
    renderProducts();
    await screen.findByText(/2 products/i, {}, LOAD_TIMEOUT);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /filters/i }));

    const callsBefore = getProductsCalls().length;

    const minInput = await screen.findByLabelText(/minimum price/i);
    fireEvent.change(minInput, { target: { value: '10000' } });

    expect(getProductsCalls().length).toBe(callsBefore);

    await user.click(screen.getByRole('button', { name: /^apply$/i }));

    await waitFor(
      () => {
        const lastCall = getProductsCalls().at(-1);
        expect(lastCall[1].params.min_price).toBe(10000);
      },
      LOAD_TIMEOUT
    );
  });

  it('renders pagination when there are multiple pages and requests the next page on click', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/categories') return Promise.resolve({ data: { data: [] } });
      if (url === '/products') {
        return Promise.resolve({
          data: { data: sampleProducts, last_page: 3, total: 25 },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderProducts();
    await screen.findByText(/25 products/i, {}, LOAD_TIMEOUT);

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '2' }));

    await waitFor(
      () => {
        const lastCall = getProductsCalls().at(-1);
        expect(lastCall[1].params.page).toBe(2);
      },
      LOAD_TIMEOUT
    );
  });

  it('shows an empty state with a reset button when no products match, and resets filters on click', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/categories') return Promise.resolve({ data: { data: [] } });
      if (url === '/products') {
        return Promise.resolve({ data: { data: [], last_page: 1, total: 0 } });
      }
      return Promise.resolve({ data: {} });
    });

    renderProducts();

    expect(
      await screen.findByText(/no products found/i, {}, LOAD_TIMEOUT)
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /reset filters/i }));

    await waitFor(
      () => {
        const lastCall = getProductsCalls().at(-1);
        expect(lastCall[1].params).not.toHaveProperty('search');
        expect(lastCall[1].params).not.toHaveProperty('category');
        expect(lastCall[1].params).not.toHaveProperty('min_price');
        expect(lastCall[1].params.page).toBe(1);
      },
      LOAD_TIMEOUT
    );
  });

  it('shows an error message when the products request fails', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/categories') return Promise.resolve({ data: { data: [] } });
      if (url === '/products') return Promise.reject(new Error('Network Error'));
      return Promise.resolve({ data: {} });
    });

    renderProducts();

    expect(
      await screen.findByText(/unable to load products right now/i)
    ).toBeInTheDocument();
  });

  it('renders product cards with the correct name, price, category badge and detail link', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/categories') return Promise.resolve({ data: { data: [] } });
      if (url === '/products') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 42,
                name: 'V-Class Pro 65"',
                description: 'A great display.',
                price: 500,
                category: { id: 1, name: 'Touchscreens' },
                images: [],
                created_at: new Date().toISOString(),
              },
            ],
            last_page: 1,
            total: 1,
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderProducts();

    expect(
      await screen.findByRole('heading', { name: 'V-Class Pro 65"' }, LOAD_TIMEOUT)
    ).toBeInTheDocument();
    expect(screen.getByText(/rs\s*500\.00/i)).toBeInTheDocument();
    expect(screen.getByText('Touchscreens')).toBeInTheDocument();
    // Correction : le lien a pour texte "Details →" et non "View Details"
    expect(screen.getByRole('link', { name: /details →/i })).toHaveAttribute(
      'href',
      '/products/42'
    );
  });
});