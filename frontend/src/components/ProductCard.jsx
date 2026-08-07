import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Check } from 'lucide-react'
import { formatPrice } from '../lib/formatPrice'
import { useCart } from '../context/CartContext'

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000

export default function ProductCard({ id, name, category, image, description, price, createdAt, stockQty }) {
  const [now] = useState(() => Date.now())
  const isNew = createdAt ? now - new Date(createdAt).getTime() < ONE_MONTH_MS : false

  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)
  const outOfStock = stockQty === 0

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({ id, name, price, image, stock_qty: stockQty })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {isNew && (
          <div
            className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 sm:px-3 py-1 rounded text-white text-xs font-bold"
            style={{ backgroundColor: '#F80000' }}
          >
            NEW
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-bold px-2 py-1 rounded whitespace-nowrap"
            style={{ backgroundColor: '#ECB115', color: '#000000' }}
          >
            {category}
          </span>
        </div>

        <h3 className="font-heading font-bold text-base md:text-lg mb-2 line-clamp-2">{name}</h3>

        <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 flex-grow line-clamp-3">
          {description}
        </p>

        <p className="font-heading font-bold text-lg md:text-xl mb-4" style={{ color: '#F80000' }}>
          {formatPrice(price)}
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 md:py-3 rounded font-semibold transition-colors text-xs md:text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: added ? '#10b981' : '#F80000' }}
            onMouseEnter={(e) => !outOfStock && !added && (e.currentTarget.style.backgroundColor = '#C62221')}
            onMouseLeave={(e) => !outOfStock && !added && (e.currentTarget.style.backgroundColor = '#F80000')}
          >
            {added ? <Check size={16} /> : <ShoppingCart size={16} />}
            {outOfStock ? 'Out of stock' : added ? 'Added' : 'Add to Cart'}
          </button>

          <Link
            to={`/products/${id}`}
            className="flex-1 flex items-center justify-center text-center py-2 md:py-3 border-2 rounded font-semibold transition-colors text-xs md:text-sm"
            style={{ borderColor: '#F80000', color: '#F80000', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F80000'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#F80000'
            }}
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  )
}