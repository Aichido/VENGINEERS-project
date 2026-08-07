import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CartContext = createContext();
const STORAGE_KEY = 'cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const maxQty = product.stock_qty ?? Infinity;

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: Math.min(item.qty + qty, maxQty) }
            : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image ?? product.images?.[0]?.thumbnail_path ?? null,
          stock_qty: product.stock_qty ?? null,
          qty: Math.min(qty, maxQty),
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, qty: item.stock_qty ? Math.min(qty, item.stock_qty) : qty }
          : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Places the order with the backend (POST /client/orders), then clears
  // the cart on success. Throws on failure — callers (CartModal, Cart)
  // are responsible for catching and displaying the error, since a 422
  // "insufficient stock" message needs to be shown inline in the UI.
  const checkout = async () => {
    const payload = {
      items: items.map((item) => ({ product_id: item.id, qty: item.qty })),
    };
    const res = await api.post('/client/orders', payload);
    clearCart();
    return res.data;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        checkout,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook co-localisé volontairement avec son Provider
export const useCart = () => useContext(CartContext);