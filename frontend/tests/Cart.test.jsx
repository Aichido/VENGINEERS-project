// Cart.test.jsx — version corrigée (test "quand l'utilisateur est connecté...")
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Cart from '../src/pages/public/Cart';
import { useCart } from '../src/context/CartContext';
import { useAuth } from '../src/context/AuthContext';

vi.mock('../src/context/CartContext', () => ({
  useCart: vi.fn(),
}));

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../src/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const defaultItems = [
  {
    id: 1,
    name: 'Product A',
    price: 10.99,
    qty: 2,
    image: 'image-a.jpg',
    stock_qty: 5,
  },
  {
    id: 2,
    name: 'Product B',
    price: 5.50,
    qty: 1,
    image: null,
    stock_qty: 3,
  },
];

const defaultTotalPrice = 10.99 * 2 + 5.50 * 1;

const mockUseCart = (overrides = {}) => ({
  items: defaultItems,
  removeFromCart: vi.fn(),
  updateQty: vi.fn(),
  totalPrice: defaultTotalPrice,
  checkout: vi.fn(),
  ...overrides,
});

const mockUseAuth = (user = null) => ({ user });

const renderCart = (cartOverrides = {}, authUser = null) => {
  const cartMock = mockUseCart(cartOverrides);
  const authMock = mockUseAuth(authUser);
  useCart.mockReturnValue(cartMock);
  useAuth.mockReturnValue(authMock);

  return render(
    <MemoryRouter initialEntries={['/cart']}>
      <Routes>
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/client/orders/:publicId" element={<div>Order detail</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Cart page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le message "panier vide" avec lien vers /products si items est vide', () => {
    renderCart({ items: [], totalPrice: 0 });
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Browse products/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/products');
  });

  it('affiche les articles avec quantités, prix unitaires, sous-totaux', () => {
    renderCart();
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('$10.99')).toBeInTheDocument();
    expect(screen.getByText('$5.50')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('$21.98')).toBeInTheDocument();
    expect(screen.getByText('$5.50')).toBeInTheDocument();
    expect(screen.getByText('$27.48')).toBeInTheDocument();
  });

  it('appelle updateQty avec les bonnes valeurs pour les boutons + et -', async () => {
    const user = userEvent.setup();
    const updateQtyMock = vi.fn();
    renderCart({ updateQty: updateQtyMock });

    const decreaseButtons = screen.getAllByRole('button', { name: /Decrease quantity/i });
    const increaseButtons = screen.getAllByRole('button', { name: /Increase quantity/i });

    await user.click(decreaseButtons[0]);
    expect(updateQtyMock).toHaveBeenCalledWith(1, 1);
    updateQtyMock.mockClear();

    await user.click(increaseButtons[0]);
    expect(updateQtyMock).toHaveBeenCalledWith(1, 3);
    updateQtyMock.mockClear();

    expect(decreaseButtons[1]).toBeDisabled();
    await user.click(increaseButtons[1]);
    expect(updateQtyMock).toHaveBeenCalledWith(2, 2);
  });

  it('appelle removeFromCart quand on clique sur le bouton poubelle', async () => {
    const user = userEvent.setup();
    const removeMock = vi.fn();
    renderCart({ removeFromCart: removeMock });

    const removeButtons = screen.getAllByRole('button', { name: /Remove .* from cart/i });
    await user.click(removeButtons[0]);
    expect(removeMock).toHaveBeenCalledWith(1);
  });

  it('quand l\'utilisateur n\'est pas connecté, le bouton "Proceed to checkout" navigue vers /login?redirect=/cart', async () => {
    const user = userEvent.setup();
    renderCart({}, null);
    const checkoutBtn = screen.getByRole('button', { name: /Log in to checkout/i });
    await user.click(checkoutBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=/cart');
    expect(screen.queryByText(/You're about to place an order/i)).not.toBeInTheDocument();
  });

  it('quand l\'utilisateur est connecté, le bouton "Proceed to checkout" affiche le panneau de confirmation', async () => {
    const user = userEvent.setup();
    renderCart({}, { id: 1, name: 'John' });
    const checkoutBtn = screen.getByRole('button', { name: /Proceed to checkout/i });
    await user.click(checkoutBtn);

    expect(screen.getByText(/You're about to place an order for/i)).toBeInTheDocument();
    // Il y a deux éléments "$27.48" : le total dans la section et celui dans le message.
    // On vérifie qu'il y en a deux.
    const totalElements = screen.getAllByText('$27.48');
    expect(totalElements).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm order/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Proceed to checkout/i })).not.toBeInTheDocument();
  });

  it('le bouton "Cancel" referme le panneau de confirmation sans appeler checkout', async () => {
    const user = userEvent.setup();
    const checkoutMock = vi.fn();
    renderCart({ checkout: checkoutMock }, { id: 1, name: 'John' });

    await user.click(screen.getByRole('button', { name: /Proceed to checkout/i }));
    await user.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(screen.queryByText(/You're about to place an order/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Proceed to checkout/i })).toBeInTheDocument();
    expect(checkoutMock).not.toHaveBeenCalled();
  });

  it('en cas de succès de checkout, navigue vers /client/orders/:publicId avec state success', async () => {
    const user = userEvent.setup();
    const mockOrder = { public_id: '#ORD-123' };
    const checkoutMock = vi.fn().mockResolvedValue(mockOrder);
    renderCart({ checkout: checkoutMock }, { id: 1, name: 'John' });

    await user.click(screen.getByRole('button', { name: /Proceed to checkout/i }));
    await user.click(screen.getByRole('button', { name: /Confirm order/i }));

    await waitFor(() => expect(checkoutMock).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalledWith(
      '/client/orders/%23ORD-123',
      { state: { success: 'Your order has been placed successfully!' } }
    );
  });

  it('en cas d\'erreur 422 (stock insuffisant), affiche le message d\'erreur exact et referme le panneau', async () => {
    const user = userEvent.setup();
    const error = {
      response: {
        data: {
          errors: {
            items: ['Stock insuffisant pour le produit « Écran 65" ».']
          }
        }
      }
    };
    const checkoutMock = vi.fn().mockRejectedValue(error);
    renderCart({ checkout: checkoutMock }, { id: 1, name: 'John' });

    await user.click(screen.getByRole('button', { name: /Proceed to checkout/i }));
    await user.click(screen.getByRole('button', { name: /Confirm order/i }));

    await waitFor(() => {
      expect(screen.getByText('Stock insuffisant pour le produit « Écran 65" ».')).toBeInTheDocument();
    });
    expect(screen.queryByText(/You're about to place an order/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Proceed to checkout/i })).toBeInTheDocument();
  });

  it('en cas d\'erreur générique (non 422), affiche un message générique', async () => {
    const user = userEvent.setup();
    const checkoutMock = vi.fn().mockRejectedValue(new Error('Network error'));
    renderCart({ checkout: checkoutMock }, { id: 1, name: 'John' });

    await user.click(screen.getByRole('button', { name: /Proceed to checkout/i }));
    await user.click(screen.getByRole('button', { name: /Confirm order/i }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong placing your order. Please try again.')).toBeInTheDocument();
    });
    expect(screen.queryByText(/You're about to place an order/i)).not.toBeInTheDocument();
  });

  it('pendant la soumission, les boutons sont désactivés et affiche "Placing order..."', async () => {
    const user = userEvent.setup();
    let resolveCheckout;
    const checkoutPromise = new Promise((resolve) => {
      resolveCheckout = resolve;
    });
    const checkoutMock = vi.fn().mockReturnValue(checkoutPromise);
    renderCart({ checkout: checkoutMock }, { id: 1, name: 'John' });

    await user.click(screen.getByRole('button', { name: /Proceed to checkout/i }));
    const confirmBtn = screen.getByRole('button', { name: /Confirm order/i });
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });

    await user.click(confirmBtn);

    expect(confirmBtn).toBeDisabled();
    expect(confirmBtn).toHaveTextContent('Placing order...');
    expect(cancelBtn).toBeDisabled();

    resolveCheckout({ public_id: '#ORD-123' });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  });
});