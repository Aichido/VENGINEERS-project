import { Link } from 'react-router-dom'
import { formatPrice } from '../lib/formatPrice'

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000

export default function ProductCard({ id, name, category, image, description, price, createdAt }) {
  const isNew = createdAt ? Date.now() - new Date(createdAt).getTime() < ONE_MONTH_MS : false

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

        <Link
          to={`/products/${id}`}
          className="w-full block text-center py-2 md:py-3 border-2 rounded font-semibold transition-colors text-xs md:text-sm"
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
          View Details →
        </Link>
      </div>
    </div>
  )
}