import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from '../src/components/Header';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../src/context/CartContext', () => ({
  useCart: vi.fn(),
}));

vi.mock('../src/components/CartModal', () => ({
  default: ({ isOpen, onClose }) => (
    <div data-testid="cart-modal">
      {isOpen ? <span>Cart modal open</span> : <span>Cart modal closed</span>}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('Header', () => {
  const mockUser = null;
  const mockTotalItems = 0;

  const renderHeader = (user = mockUser, totalItems = mockTotalItems) => {
    useAuth.mockReturnValue({ user });
    useCart.mockReturnValue({ totalItems });
    return render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation links', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Services/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request a Quote/i })).toBeInTheDocument();
  });

  it('applies active styles to current route (non-contact)', () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Header />
      </MemoryRouter>
    );
    const productsLinks = screen.getAllByRole('link', { name: /Products/i });
    const activeLink = productsLinks.find(link => link.classList.contains('border-b-2'));
    expect(activeLink).toBeDefined();
    expect(activeLink).toHaveClass('border-b-2');
    expect(activeLink.style.borderColor).toBe('rgb(188, 1, 0)');
  });

  it('applies active style to contact route (text color only)', () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <Header />
      </MemoryRouter>
    );
    const contactLinks = screen.getAllByRole('link', { name: /Contact/i });
    const activeLink = contactLinks.find(link => link.classList.contains('text-[#F80000]'));
    expect(activeLink).toBeDefined();
    expect(activeLink).toHaveClass('text-[#F80000]');
    expect(activeLink.style.borderColor).toBe('');
  });

  it('shows cart badge with totalItems when > 0', () => {
    renderHeader(null, 3);
    const badges = screen.getAllByText('3');
    expect(badges).toHaveLength(2);
    const badge = badges[0];
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('absolute -top-0.5 -right-0.5');
  });

  it('does not show cart badge when totalItems is 0', () => {
    renderHeader(null, 0);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  // --- CORRECTION ICI : un seul lien attendu ---
  it('renders "My Space" link when user is logged in', () => {
    const user = { role: { name: 'client' } };
    renderHeader(user);
    // Le menu mobile n'étant pas ouvert, un seul lien "My Space" est présent (desktop)
    const mySpaceLinks = screen.getAllByRole('link', { name: /My Space/i });
    expect(mySpaceLinks).toHaveLength(1);
    const link = mySpaceLinks[0];
    expect(link).toHaveAttribute('href', '/client');
  });

  // --- NOUVEAU : rôle commercial (Phase 4) ---
  it('renders "My Space" link pointing to /commercial when user role is commercial', () => {
    const user = { role: { name: 'commercial' } };
    renderHeader(user);
    const mySpaceLinks = screen.getAllByRole('link', { name: /My Space/i });
    expect(mySpaceLinks).toHaveLength(1);
    const link = mySpaceLinks[0];
    expect(link).toHaveAttribute('href', '/commercial');
  });

  // --- NOUVEAU : rôle sans dashboard encore implémenté (technicien/admin) ---
  it('renders "My Space" link pointing to /technicien when user role is technicien', () => {
    const user = { role: { name: 'technicien' } };
    renderHeader(user);
    const mySpaceLinks = screen.getAllByRole('link', { name: /My Space/i });
    expect(mySpaceLinks).toHaveLength(1);
    const link = mySpaceLinks[0];
    expect(link).toHaveAttribute('href', '/technicien');
  });
    // --- NOUVEAU : rôle sans dashboard encore implémenté (technicien/admin) ---
  it('renders "My Space" link pointing to /admin when user role is admin', () => {
    const user = { role: { name: 'admin' } };
    renderHeader(user);
    const mySpaceLinks = screen.getAllByRole('link', { name: /My Space/i });
    expect(mySpaceLinks).toHaveLength(1);
    const link = mySpaceLinks[0];
    expect(link).toHaveAttribute('href', '/admin');
  });

  // --- CORRECTION ICI : un seul lien attendu ---
  it('renders "Request a Quote" link when user is not logged in', () => {
    renderHeader(null);
    const quoteLinks = screen.getAllByRole('link', { name: /Request a Quote/i });
    expect(quoteLinks).toHaveLength(1);
    const link = quoteLinks[0];
    expect(link).toHaveAttribute('href', '/login');
  });

  it('changes background color on hover for desktop quote button', async () => {
    const user = userEvent.setup();
    renderHeader();
    const desktopQuote = screen.getAllByRole('link', { name: /Request a Quote/i })[0];
    expect(desktopQuote.style.backgroundColor).toBe('rgb(188, 1, 0)');

    await user.hover(desktopQuote);
    expect(desktopQuote.style.backgroundColor).toBe('rgb(198, 34, 33)');

    await user.unhover(desktopQuote);
    expect(desktopQuote.style.backgroundColor).toBe('rgb(188, 1, 0)');
  });

  it('toggles mobile menu on hamburger click', async () => {
    const user = userEvent.setup();
    const { container } = renderHeader();
    expect(container.querySelector('.lg\\:hidden.border-t')).not.toBeInTheDocument();

    const hamburger = screen.getByRole('button', { name: /Open menu/i });
    await user.click(hamburger);

    const mobileMenu = container.querySelector('.lg\\:hidden.border-t');
    expect(mobileMenu).toBeInTheDocument();
    expect(mobileMenu.querySelector('a[href="/"]')).toBeInTheDocument();

    await user.click(hamburger);
    await waitFor(() => {
      expect(container.querySelector('.lg\\:hidden.border-t')).not.toBeInTheDocument();
    });
  });

  it('closes mobile menu when a link is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderHeader();
    const hamburger = screen.getByRole('button', { name: /Open menu/i });
    await user.click(hamburger);

    const mobileMenu = container.querySelector('.lg\\:hidden.border-t');
    expect(mobileMenu).toBeInTheDocument();

    const homeLinkMobile = mobileMenu.querySelector('a[href="/"]');
    await user.click(homeLinkMobile);

    await waitFor(() => {
      expect(container.querySelector('.lg\\:hidden.border-t')).not.toBeInTheDocument();
    });
  });

  it('opens and closes CartModal when cart button is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();
    const cartButtons = screen.getAllByRole('button', { name: /View cart/i });
    const cartButton = cartButtons[0];
    await user.click(cartButton);

    const modal = await screen.findByTestId('cart-modal');
    expect(modal).toHaveTextContent('Cart modal open');

    const closeButton = within(modal).getByRole('button', { name: /Close/i });
    await user.click(closeButton);
    expect(modal).toHaveTextContent('Cart modal closed');
  });
});