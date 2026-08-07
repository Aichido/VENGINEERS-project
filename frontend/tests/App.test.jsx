import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

// App.jsx used to be the default Vite template (logos, demo counter).
// It now renders the real Vengineers routing (PublicLayout + public pages),
// so this file replaces the old template-based test entirely.

// Mock the shared Axios instance so routing tests never hit the network.
// Each data-driven page (Home, Products, ProductDetail) gets a minimal,
// safe payload matching the real API response shape.
vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn((url) => {
      // GET /products/:id -> single product detail (flat object, not paginated)
      if (/\/products\/\d+$/.test(url)) {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Test Product',
            description: 'A test product used for routing tests.',
            price: 1234.5,
            created_at: new Date().toISOString(),
            category: { id: 1, name: 'Test Category' },
            images: [
              {
                id: 1,
                path: 'https://picsum.photos/seed/1/600/400',
                is_primary: true,
                position: 1,
              },
            ],
          },
        });
      }

      // GET /products, GET /categories -> paginated/list shape
      return Promise.resolve({ data: { data: [], last_page: 1, total: 0 } });
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('App routing', () => {
  it('renders the Home page at "/"', async () => {
    renderAt('/');
    expect(
      await screen.findByRole(
        'heading',
        { name: /touch excellence/i },
        { timeout: 3000 }
      )
    ).toBeInTheDocument();
  });

  it('renders the About page at "/about"', async () => {
    renderAt('/about');
    expect(
      await screen.findByRole('heading', { name: /about vengineers/i })
    ).toBeInTheDocument();
  });

  it('renders the Products page at "/products"', async () => {
    renderAt('/products');
    expect(
      await screen.findByRole(
        'heading',
        { name: /cutting-edge technology at your fingertips/i },
        { timeout: 3000 }
      )
    ).toBeInTheDocument();
  });

  it('renders the Product Detail page at "/products/:id"', async () => {
    renderAt('/products/1');
    expect(
      await screen.findByRole(
        'heading',
        { name: /test product/i },
        { timeout: 3000 }
      )
    ).toBeInTheDocument();
  });

  it('renders the Services page at "/services"', async () => {
    renderAt('/services');
    expect(
      await screen.findByRole('heading', { name: /our services/i })
    ).toBeInTheDocument();
  });

  it('renders the Contact page at "/contact"', async () => {
    renderAt('/contact');
    expect(
      await screen.findByRole('heading', {
        name: /let's talk about your project/i,
      })
    ).toBeInTheDocument();
  });

 it('renders the Login page at "/login"', async () => {
  renderAt('/login');
  expect(
    await screen.findByRole('heading', { name: /^Login$/i })
  ).toBeInTheDocument();
});

it('renders the Register page at "/register"', async () => {
  renderAt('/register');
  expect(
    await screen.findByRole('heading', { name: /^create an account$/i })
  ).toBeInTheDocument();
});
});