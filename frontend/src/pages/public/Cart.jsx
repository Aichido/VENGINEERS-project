import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Cart() {
  const { items, removeFromCart, updateQty, totalPrice, checkout } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleCheckoutClick = () => {
    if (!user) {
      navigate('/login?redirect=/cart');
      return;
    }
    setCheckoutError('');
    setConfirming(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setCheckoutError('');

    try {
      const order = await checkout();
      navigate(`/client/orders/${encodeURIComponent(order.public_id)}`, {
        state: { success: 'Your order has been placed successfully!' },
      });
    } catch (err) {
      const stockError = err.response?.data?.errors?.items?.[0];
      setCheckoutError(
        stockError || 'Something went wrong placing your order. Please try again.'
      );
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-black mb-4">Your cart is empty</h1>
        <p className="text-[#707070] mb-6">Browse our products and add something to your cart.</p>
        <Link
          to="/products"
          className="inline-block px-6 py-3 rounded text-white font-semibold"
          style={{ backgroundColor: '#F80000' }}
        >
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="container py-10">
      <h1 className="text-2xl font-bold text-black mb-6">Your cart</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 bg-white border border-gray-200 rounded p-4"
          >
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
            ) : (
              <div className="w-16 h-16 bg-[#F7F7F7] rounded" />
            )}

            <div className="flex-1">
              <p className="font-semibold text-black">{item.name}</p>
              <p className="text-sm text-[#707070]">${item.price}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.id, item.qty - 1)}
                disabled={item.qty <= 1}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
                aria-label={`Decrease quantity of ${item.name}`}
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center">{item.qty}</span>
              <button
                onClick={() => updateQty(item.id, item.qty + 1)}
                disabled={item.stock_qty != null && item.qty >= item.stock_qty}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
                aria-label={`Increase quantity of ${item.name}`}
              >
                <Plus size={14} />
              </button>
            </div>

            <p className="w-20 text-right font-semibold text-black">
              ${(item.price * item.qty).toFixed(2)}
            </p>

            <button
              onClick={() => removeFromCart(item.id)}
              className="p-2 text-[#707070] hover:text-[#F80000] transition-colors"
              aria-label={`Remove ${item.name} from cart`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded p-6 space-y-4">
          {checkoutError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              {checkoutError}
            </p>
          )}

          <div className="flex justify-between text-lg font-bold text-black">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          {!confirming ? (
            <button
              onClick={handleCheckoutClick}
              className="w-full px-6 py-3 rounded text-white font-semibold"
              style={{ backgroundColor: '#F80000' }}
            >
              {user ? 'Proceed to checkout' : 'Log in to checkout'}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#707070]">
                You're about to place an order for <strong>${totalPrice.toFixed(2)}</strong>.
                Do you want to confirm?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded border-2 border-gray-300 text-[#707070] font-semibold disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded text-white font-semibold disabled:opacity-60"
                  style={{ backgroundColor: '#F80000' }}
                >
                  {submitting ? 'Placing order...' : 'Confirm order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}