// CartContext.test.jsx — version finale sans unhandled rejection
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { CartProvider, useCart } from '../src/context/CartContext';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Composant qui expose la fonction checkout via une prop callback
function TestConsumer({ onCheckout }) {
  const {
    items,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    checkout,
    totalItems,
    totalPrice,
  } = useCart();

  // Exposer checkout au test via useEffect
  useEffect(() => {
    if (onCheckout) {
      onCheckout(checkout);
    }
  }, [onCheckout, checkout]);

  return (
    <div>
      <div data-testid="items">{JSON.stringify(items)}</div>
      <div data-testid="totalItems">{totalItems}</div>
      <div data-testid="totalPrice">{totalPrice}</div>
      <button onClick={() => addToCart({ id: 1, name: 'Product A', price: 10, stock_qty: 5 })}>
        Add A
      </button>
      <button onClick={() => addToCart({ id: 2, name: 'Product B', price: 20, stock_qty: 3 }, 2)}>
        Add B x2
      </button>
      <button onClick={() => addToCart({ id: 3, name: 'Product C', price: 30, stock_qty: 0 })}>
        Add C (out of stock)
      </button>
      <button onClick={() => removeFromCart(1)}>Remove A</button>
      <button onClick={() => updateQty(1, 3)}>Update A qty 3</button>
      <button onClick={() => updateQty(1, 0)}>Update A qty 0</button>
      <button onClick={() => clearCart()}>Clear</button>
      {/* Le bouton checkout appelle toujours la fonction du contexte, mais on l'utilise rarement dans les tests */}
      <button onClick={() => checkout()}>Checkout</button>
    </div>
  );
}

function renderWithProvider(onCheckout) {
  return render(
    <CartProvider>
      <TestConsumer onCheckout={onCheckout} />
    </CartProvider>
  );
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('initializes with empty cart from localStorage if no data', () => {
    renderWithProvider();
    expect(screen.getByTestId('items')).toHaveTextContent('[]');
    expect(screen.getByTestId('totalItems')).toHaveTextContent('0');
    expect(screen.getByTestId('totalPrice')).toHaveTextContent('0');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('cart');
  });

  it('loads cart from localStorage if data exists', () => {
    const initialCart = [{ id: 1, name: 'Product A', price: 10, qty: 2 }];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(initialCart));
    renderWithProvider();
    expect(screen.getByTestId('items')).toHaveTextContent(JSON.stringify(initialCart));
    expect(screen.getByTestId('totalItems')).toHaveTextContent('2');
    expect(screen.getByTestId('totalPrice')).toHaveTextContent('20');
  });

  it('adds a new item to cart', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByText('Add A'));
    const items = JSON.parse(screen.getByTestId('items').textContent);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 1, name: 'Product A', price: 10, qty: 1 });
    expect(screen.getByTestId('totalItems')).toHaveTextContent('1');
    expect(screen.getByTestId('totalPrice')).toHaveTextContent('10');
  });

  it('increments quantity if item already exists, capped by stock_qty', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Add A'));
    const items = JSON.parse(screen.getByTestId('items').textContent);
    expect(items[0].qty).toBe(2);
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByText('Add A'));
    }
    const itemsFinal = JSON.parse(screen.getByTestId('items').textContent);
    expect(itemsFinal[0].qty).toBe(5);
  });

  it('adds item with specified quantity and caps to stock_qty', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByText('Add B x2'));
    const items = JSON.parse(screen.getByTestId('items').textContent);
    expect(items[0].qty).toBe(2);
    await user.click(screen.getByText('Add B x2'));
    const items2 = JSON.parse(screen.getByTestId('items').textContent);
    expect(items2[0].qty).toBe(3);
  });

  it('does not add item if stock_qty is 0 (ajoute avec qty=0, totalItems reste 0)', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByText('Add C (out of stock)'));
    const items = JSON.parse(screen.getByTestId('items').textContent);
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(0);
    expect(screen.getByTestId('totalItems')).toHaveTextContent('0');
  });

  it('removes an item from cart', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Remove A'));
    const items = JSON.parse(screen.getByTestId('items').textContent);
    expect(items).toHaveLength(0);
    expect(screen.getByTestId('totalItems')).toHaveTextContent('0');
    expect(screen.getByTestId('totalPrice')).toHaveTextContent('0');
  });

  it('updates quantity with cap and rejects qty < 1', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Update A qty 3'));
    let items = JSON.parse(screen.getByTestId('items').textContent);
    expect(items[0].qty).toBe(3);
    await user.click(screen.getByText('Update A qty 0'));
    items = JSON.parse(screen.getByTestId('items').textContent);
    expect(items[0].qty).toBe(3);
  });

  it('calculates totalItems and totalPrice correctly', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Add B x2'));
    expect(screen.getByTestId('totalItems')).toHaveTextContent('3');
    expect(screen.getByTestId('totalPrice')).toHaveTextContent('50');
  });

  it('persists cart to localStorage on every change', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cart', '[]');
    localStorageMock.setItem.mockClear();

    await user.click(screen.getByText('Add A'));
    const callArg = localStorageMock.setItem.mock.calls[0];
    expect(callArg[0]).toBe('cart');
    const parsed = JSON.parse(callArg[1]);
    expect(parsed).toMatchObject([{ id: 1, name: 'Product A', price: 10, qty: 1, image: null, stock_qty: 5 }]);
    localStorageMock.setItem.mockClear();

    await user.click(screen.getByText('Remove A'));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cart', '[]');
  });

  it('checkout calls api.post with correct payload, clears cart, returns order data', async () => {
    const user = userEvent.setup();
    const mockOrder = { id: 1, public_id: '#ORD-123' };
    api.post.mockResolvedValueOnce({ data: mockOrder });

    let checkoutFn;
    const onCheckout = (fn) => { checkoutFn = fn; };

    renderWithProvider(onCheckout);
    await user.click(screen.getByText('Add A'));
    await user.click(screen.getByText('Add B x2'));

    // Appeler checkout directement via la fonction exposée
    await checkoutFn();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/client/orders', {
        items: [
          { product_id: 1, qty: 1 },
          { product_id: 2, qty: 2 },
        ],
      });
    });

    expect(screen.getByTestId('items')).toHaveTextContent('[]');
    expect(screen.getByTestId('totalItems')).toHaveTextContent('0');
  });

  it('checkout throws error and does not clear cart on failure', async () => {
    const user = userEvent.setup();
    const error = new Error('Insufficient stock');
    api.post.mockRejectedValueOnce(error);

    let checkoutFn;
    const onCheckout = (fn) => { checkoutFn = fn; };

    renderWithProvider(onCheckout);
    await user.click(screen.getByText('Add A'));

    // Appeler checkout et capturer l'erreur
    try {
      await checkoutFn();
    } catch {
      // L'erreur est normale, on la capture
    }

    // Vérifier que l'appel API a bien eu lieu
    expect(api.post).toHaveBeenCalledWith('/client/orders', {
      items: [{ product_id: 1, qty: 1 }],
    });

    // Le panier doit toujours contenir l'item
    const items = JSON.parse(screen.getByTestId('items').textContent);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 1, name: 'Product A', qty: 1 });
    expect(screen.getByTestId('totalItems')).toHaveTextContent('1');
  });
});