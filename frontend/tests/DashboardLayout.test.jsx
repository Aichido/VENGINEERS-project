import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardLayout from '../src/layouts/DashboardLayout';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../src/context/CartContext', () => ({
  useCart: vi.fn(),
}));

// Mock du composant Outlet pour simplifier le rendu
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet content</div>,
  };
});

describe('DashboardLayout', () => {
  const mockUser = {
    name: 'John Doe',
    email: 'john@example.com',
    role: { name: 'client' },
  };
  const mockLogout = vi.fn();
  const mockTotalItems = 0;

  const renderDashboard = (user = mockUser, totalItems = mockTotalItems, initialPath = '/client') => {
    useAuth.mockReturnValue({ user, logout: mockLogout });
    useCart.mockReturnValue({ totalItems });
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/client" element={<DashboardLayout />}>
            <Route index element={<div>Overview content</div>} />
            <Route path="orders" element={<div>Orders content</div>} />
            <Route path="interventions" element={<div>Interventions content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the user name and initials in the top bar', () => {
    renderDashboard();
    expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // initials
    expect(screen.getByText('client')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /My Orders/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Interventions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cart/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse Catalog/i })).toBeInTheDocument();
  });

  it('applies active styles to the current route (Overview with exact match)', () => {
    renderDashboard(undefined, undefined, '/client');
    const overviewLink = screen.getByRole('link', { name: /Overview/i });
    // Le lien actif doit avoir la classe bg-[#BC0100] text-white
    expect(overviewLink).toHaveClass('bg-[#BC0100]');
    expect(overviewLink).toHaveClass('text-white');
    // Les autres liens ne doivent pas avoir cette classe
    const ordersLink = screen.getByRole('link', { name: /My Orders/i });
    expect(ordersLink).not.toHaveClass('bg-[#BC0100]');
  });

  it('shows cart badge when totalItems > 0', () => {
    renderDashboard(mockUser, 3);
    // Le badge est un span avec le nombre
    const badge = screen.getByText('3');
    expect(badge).toBeInTheDocument();
    // Vérifier que le badge a les bonnes classes (optionnel)
    expect(badge).toHaveClass('absolute -top-2 -right-2');
  });

  it('does not show cart badge when totalItems is 0', () => {
    renderDashboard(mockUser, 0);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    // On peut aussi vérifier qu'il n'y a pas d'élément avec la classe du badge
    const badges = document.querySelectorAll('.absolute.-top-2.-right-2');
    expect(badges.length).toBe(0);
  });

  it('calls logout when logout button is clicked', async () => {
    const user = userEvent.setup();
    renderDashboard();
    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    await user.click(logoutButton);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('toggles mobile menu on hamburger click', async () => {
    const user = userEvent.setup();
    const { container } = renderDashboard();
    // Le menu mobile est masqué par défaut (translate -x-full)
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('-translate-x-full');

    // Ouvrir le menu
    const hamburger = screen.getByRole('button', { name: /Open menu/i });
    await user.click(hamburger);
    // Le sidebar doit avoir la classe translate-x-0
    expect(sidebar).toHaveClass('translate-x-0');

    // Fermer via le bouton "Close menu" (le X),  le bouton X dans le sidebar (le second est le backdrop)
   const closeButtons = screen.getAllByRole('button', { name: /Close menu/i });
    const closeButton = closeButtons[0];
    await user.click(closeButton);
    expect(sidebar).toHaveClass('-translate-x-full');
  });

  it('closes mobile menu when overlay is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderDashboard();
    const sidebar = container.querySelector('aside');
    const hamburger = screen.getByRole('button', { name: /Open menu/i });
    await user.click(hamburger);
    expect(sidebar).toHaveClass('translate-x-0');

    // L'overlay est un div avec classe md:hidden et onClick qui ferme
    const overlay = document.querySelector('.fixed.inset-0.z-40.bg-black\\/40.md\\:hidden');
    expect(overlay).toBeInTheDocument();
    await user.click(overlay);
    expect(sidebar).toHaveClass('-translate-x-full');
  });

  it('renders the Outlet content', () => {
    renderDashboard();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByText('Outlet content')).toBeInTheDocument();
  });

  // Test supplémentaire : le lien Overview a l'attribut end=true, donc il n'est pas actif sur /client/orders
  it('Overview link is not active on a sub-route', () => {
    renderDashboard(undefined, undefined, '/client/orders');
    const overviewLink = screen.getByRole('link', { name: /Overview/i });
    // Il ne doit pas avoir la classe active
    expect(overviewLink).not.toHaveClass('bg-[#BC0100]');
    // Le lien "My Orders" doit être actif
    const ordersLink = screen.getByRole('link', { name: /My Orders/i });
    expect(ordersLink).toHaveClass('bg-[#BC0100]');
  });
});