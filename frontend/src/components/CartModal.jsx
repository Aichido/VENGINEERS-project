import { X, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const COLORS = {
  primary: '#F80000',
  primaryHover: '#C62221',
}

export default function CartModal({ isOpen, onClose }) {
  const { items, removeFromCart, updateQty, totalPrice } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleCheckout = () => {
    onClose()
    if (!user) {
      navigate('/login?redirect=/cart')
      return
    }
    navigate('/cart')
  }

  return (
    <>
      {/* Backdrop */}
    <button
      type="button"
      className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); } }}
      aria-label="Close cart"
    />

      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-lg flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-black">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close cart"
          >
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
              <Link
                to="/products"
                onClick={onClose}
                className="inline-block px-6 py-2 rounded text-white font-semibold transition-colors"
                style={{ backgroundColor: COLORS.primary }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.primaryHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-[#F7F7F7] rounded flex-shrink-0" />
                    )}

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-lg font-bold mb-3" style={{ color: COLORS.primary }}>
                        ${Number(item.price).toFixed(2)}
                      </p>

                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}
                          disabled={item.qty <= 1}
                          className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-40"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          −
                        </button>
                        <span className="px-3 py-1 border border-gray-300 rounded w-10 text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          disabled={item.stock_qty != null && item.qty >= item.stock_qty}
                          className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-40"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 text-sm"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between text-xl font-bold">
              <span className="text-black">Total:</span>
              <span style={{ color: COLORS.primary }}>${totalPrice.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full px-6 py-3 rounded text-white font-semibold transition-colors"
              style={{ backgroundColor: COLORS.primary }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.primaryHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
            >
              {user ? 'Proceed to Checkout' : 'Log in to Checkout'}
            </button>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 rounded border-2 font-semibold transition-colors"
              style={{ borderColor: COLORS.primary, color: COLORS.primary }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}