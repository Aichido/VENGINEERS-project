// CartModal.test.jsx — version complète avec tests de survol
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CartModal from '../src/components/CartModal';
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

const defaultCartItems = [
  {
    id: 1,
    name: 'Product 1',
    price: 10.99,
    qty: 2,
    image: 'image1.jpg',
    stock_qty: 5,
  },
  {
    id: 2,
    name: 'Product 2',
    price: 5.50,
    qty: 1,
    image: null,
    stock_qty: 3,
  },
];

const defaultTotalPrice = 10.99 * 2 + 5.50 * 1; // 27.48

const mockUseCart = (items = defaultCartItems, totalPrice = defaultTotalPrice) => {
  return {
    items,
    removeFromCart: vi.fn(),
    updateQty: vi.fn(),
    totalPrice,
  };
};

const mockUseAuth = (user = null) => {
  return { user };
};

const renderCartModal = (isOpen = true, onClose = vi.fn(), cartOverrides = {}, authOverrides = {}) => {
  const cartMock = mockUseCart(
    cartOverrides.items ?? defaultCartItems,
    cartOverrides.totalPrice ?? defaultTotalPrice
  );
  const authMock = mockUseAuth(authOverrides.user ?? null);

  useCart.mockReturnValue(cartMock);
  useAuth.mockReturnValue(authMock);

  return render(
    <MemoryRouter>
      <CartModal isOpen={isOpen} onClose={onClose} />
    </MemoryRouter>
  );
};

describe('CartModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ne rend rien si isOpen est false', () => {
    const onClose = vi.fn();
    renderCartModal(false, onClose);
    expect(screen.queryByText('Shopping Cart')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Close cart/i })).not.toBeInTheDocument();
  });

  it('affiche le panier vide avec le lien "Continue Shopping"', () => {
    const onClose = vi.fn();
    renderCartModal(true, onClose, { items: [], totalPrice: 0 });

    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    const continueLink = screen.getByRole('link', { name: /Continue Shopping/i });
    expect(continueLink).toBeInTheDocument();
    expect(continueLink).toHaveAttribute('href', '/products');
    expect(screen.queryByText('Total:')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Log in to Checkout/i })).not.toBeInTheDocument();
  });

  it('affiche les items, quantités, prix et total (avec utilisateur déconnecté)', () => {
    const onClose = vi.fn();
    renderCartModal(true, onClose, {}, { user: null }); // déconnecté

    // Items
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('$10.99')).toBeInTheDocument();
    expect(screen.getByText('$5.50')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // qty product 1
    expect(screen.getByText('1')).toBeInTheDocument(); // qty product 2

    // Total
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('$27.48')).toBeInTheDocument();

    // Boutons
    expect(screen.getAllByRole('button', { name: /Decrease quantity/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Increase quantity/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Remove/i })).toHaveLength(2);
    // Vérifier le bouton de checkout : "Log in to Checkout" car déconnecté
    expect(screen.getByRole('button', { name: /Log in to Checkout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue Shopping/i })).toBeInTheDocument();
  });

  it('appelle removeFromCart quand on clique sur Remove', async () => {
    const user = userEvent.setup();
    const cartMock = mockUseCart();
    const removeFromCartSpy = cartMock.removeFromCart;
    useCart.mockReturnValue(cartMock);
    useAuth.mockReturnValue(mockUseAuth(null));

    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <CartModal isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    await user.click(removeButtons[0]);
    expect(removeFromCartSpy).toHaveBeenCalledWith(1);
  });

  it('appelle updateQty avec les bonnes valeurs pour les boutons +/-', async () => {
    const user = userEvent.setup();
    const cartMock = mockUseCart();
    const updateQtySpy = cartMock.updateQty;
    useCart.mockReturnValue(cartMock);
    useAuth.mockReturnValue(mockUseAuth(null));

    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <CartModal isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    const decreaseButtons = screen.getAllByRole('button', { name: /Decrease quantity/i });
    const increaseButtons = screen.getAllByRole('button', { name: /Increase quantity/i });

    // Pour le premier item (qty=2)
    await user.click(decreaseButtons[0]);
    expect(updateQtySpy).toHaveBeenCalledWith(1, 1); // 2-1 = 1
    updateQtySpy.mockClear();

    await user.click(increaseButtons[0]);
    expect(updateQtySpy).toHaveBeenCalledWith(1, 3); // 2+1 = 3
    updateQtySpy.mockClear();

    // Pour le deuxième item (qty=1), le bouton decrease est désactivé
    expect(decreaseButtons[1]).toBeDisabled();

    // On clique sur increase pour le deuxième item
    await user.click(increaseButtons[1]);
    expect(updateQtySpy).toHaveBeenCalledWith(2, 2); // 1+1 = 2
  });

  it('ferme le modal et navigue vers /login?redirect=/cart si non connecté', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderCartModal(true, onClose, {}, { user: null });

    const checkoutButton = screen.getByRole('button', { name: /Log in to Checkout/i });
    await user.click(checkoutButton);

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=/cart');
  });

  it('ferme le modal et navigue vers /cart si connecté', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderCartModal(true, onClose, {}, { user: { id: 1, name: 'Test User' } });

    const checkoutButton = screen.getByRole('button', { name: /Proceed to Checkout/i });
    await user.click(checkoutButton);

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/cart');
  });

  it('n\'appelle pas l\'API /client/orders (vérification qu\'aucun post n\'est fait)', async () => {
    const api = await import('../src/services/api');
    const postSpy = api.default.post;

    const user = userEvent.setup();
    renderCartModal(true, vi.fn(), {}, { user: { id: 1 } });

    const checkoutButton = screen.getByRole('button', { name: /Proceed to Checkout/i });
    await user.click(checkoutButton);

    expect(postSpy).not.toHaveBeenCalled();
  });

  it('ferme le modal quand on clique sur le backdrop', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderCartModal(true, onClose);

    const backdrop = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    expect(backdrop).toBeInTheDocument();
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalled();
  });

  it('ferme le modal quand on clique sur le bouton "X"', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderCartModal(true, onClose);

    const closeButtons = screen.getAllByRole('button', { name: /Close cart/i });
    const closeButton = closeButtons[1]; // le bouton X (le premier est le backdrop)
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('ferme le modal quand on clique sur "Continue Shopping" dans le footer (panier rempli)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderCartModal(true, onClose, {}, { user: { id: 1 } });
    // Le footer n'apparaît que si items.length > 0 (par défaut, il y a des items)
    const continueButton = screen.getByRole('button', { name: /Continue Shopping/i });
    await user.click(continueButton);
    expect(onClose).toHaveBeenCalled();
  });

  // --- Nouveaux tests pour couvrir les lignes 34-63, 139, 149 ---

  it('change la couleur du lien "Continue Shopping" au survol (panier vide)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderCartModal(true, onClose, { items: [], totalPrice: 0 });

    const continueLink = screen.getByRole('link', { name: /Continue Shopping/i });
    // La couleur de fond initiale est #F80000 (rgb(248,0,0))
    expect(continueLink.style.backgroundColor).toBe('rgb(248, 0, 0)');

    await user.hover(continueLink);
    expect(continueLink.style.backgroundColor).toBe('rgb(198, 34, 33)');

    await user.unhover(continueLink);
    expect(continueLink.style.backgroundColor).toBe('rgb(248, 0, 0)');
  });

 // tests/CartModal.test.jsx — correction du test de survol du bouton "Continue Shopping" du footer

  it('change la couleur du bouton "Continue Shopping" du footer au survol (panier rempli)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderCartModal(true, onClose);

    const footerContinueButton = screen.getByRole('button', { name: /Continue Shopping/i });
    // La couleur de fond n'est pas définie initialement, donc la propriété est vide.
    // On peut soit accepter '' (chaîne vide) ou utiliser getComputedStyle pour la couleur réelle.
    // Ici on vérifie que la couleur de fond est vide (non définie).
    expect(footerContinueButton.style.backgroundColor).toBe('');
    expect(footerContinueButton.style.borderColor).toBe('rgb(248, 0, 0)');
    expect(footerContinueButton.style.color).toBe('rgb(248, 0, 0)');

    await user.hover(footerContinueButton);
    // Après survol, la couleur devient #f5f5f5 (rgb(245, 245, 245))
    expect(footerContinueButton.style.backgroundColor).toBe('rgb(245, 245, 245)');

    await user.unhover(footerContinueButton);
    // Après sortie, la couleur redevient 'transparent' car définie explicitement dans onMouseLeave
    expect(footerContinueButton.style.backgroundColor).toBe('transparent');
  });

  it('change la couleur du bouton "Proceed to Checkout" au survol', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderCartModal(true, onClose, {}, { user: { id: 1 } }); // connecté pour voir le bouton

    const checkoutButton = screen.getByRole('button', { name: /Proceed to Checkout/i });
    expect(checkoutButton.style.backgroundColor).toBe('rgb(248, 0, 0)');

    await user.hover(checkoutButton);
    expect(checkoutButton.style.backgroundColor).toBe('rgb(198, 34, 33)');

    await user.unhover(checkoutButton);
    expect(checkoutButton.style.backgroundColor).toBe('rgb(248, 0, 0)');
  });

  it('change la couleur du bouton "Log in to Checkout" au survol', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderCartModal(true, onClose, {}, { user: null });

    const loginButton = screen.getByRole('button', { name: /Log in to Checkout/i });
    expect(loginButton.style.backgroundColor).toBe('rgb(248, 0, 0)');

    await user.hover(loginButton);
    expect(loginButton.style.backgroundColor).toBe('rgb(198, 34, 33)');

    await user.unhover(loginButton);
    expect(loginButton.style.backgroundColor).toBe('rgb(248, 0, 0)');
  });
});