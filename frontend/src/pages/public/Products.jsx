import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import ProductCardSkeleton from '../../components/ProductCardSkeleton'
import { getPrimaryImage } from '../../lib/productImage'
import { formatPrice } from '../../lib/formatPrice'
import api from '../../services/api'

const ITEMS_PER_PAGE = 9
const SEARCH_DEBOUNCE_MS = 400
const PRICE_MIN = 0
const PRICE_MAX = 50000
const PRICE_STEP = 1000

export default function Products() {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null) // null = "All"
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [priceRange, setPriceRange] = useState([PRICE_MIN, PRICE_MAX])
  const [appliedPriceRange, setAppliedPriceRange] = useState([PRICE_MIN, PRICE_MAX])
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const [products, setProducts] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load categories once for the filter tabs
  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.data || res.data || []))
      .catch(() => setCategories([]))
  }, [])

  // Debounce the search input before it triggers a request
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  // Fetch products whenever filters or page change
  useEffect(() => {
    let cancelled = false

    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      const params = { page: currentPage, per_page: ITEMS_PER_PAGE }
      if (debouncedSearch) params.search = debouncedSearch
      if (selectedCategory) params.category = selectedCategory
      if (appliedPriceRange[0] > PRICE_MIN) params.min_price = appliedPriceRange[0]
      if (appliedPriceRange[1] < PRICE_MAX) params.max_price = appliedPriceRange[1]

      const minDelay = new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        const [res] = await Promise.all([api.get('/products', { params }), minDelay])
        if (cancelled) return
        const payload = res.data
        setProducts(payload.data || [])
        setTotalPages(payload.last_page || 1)
        setTotalItems(payload.total ?? payload.data?.length ?? 0)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to fetch products:', err)
        setError('Unable to load products right now. Please try again shortly.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
    }
  }, [selectedCategory, debouncedSearch, appliedPriceRange, currentPage])

  const applyPriceFilter = () => {
    setAppliedPriceRange(priceRange)
    setCurrentPage(1)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setDebouncedSearch('')
    setSelectedCategory(null)
    setPriceRange([PRICE_MIN, PRICE_MAX])
    setAppliedPriceRange([PRICE_MIN, PRICE_MAX])
    setCurrentPage(1)
  }

  return (
    <main>
      {/* Hero Section */}
      <section className="bg-black text-white py-12 md:py-20 lg:py-24">
        <div className="container">
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 md:mb-4">
            Cutting-Edge Technology at Your Fingertips.
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-3xl leading-relaxed">
            Discover our complete range of interactive solutions designed for demanding
            professional environments, from 4K interactive displays to precision mounting
            accessories.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-gray-50 py-6 md:py-8 border-b border-gray-200 sticky top-0 z-10">
        <div className="container">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-center justify-between mb-4 md:mb-6">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded font-semibold transition-colors text-sm md:text-base border"
              style={
                showFilters
                  ? { backgroundColor: '#F80000', color: '#fff', borderColor: '#F80000' }
                  : { backgroundColor: '#fff', color: '#000000', borderColor: '#d1d5db' }
              }
            >
              {showFilters ? <X size={18} /> : <SlidersHorizontal size={18} />}
              Filters
            </button>

            <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap">
              {totalItems} product{totalItems !== 1 ? 's' : ''}
            </span>
          </div>

          {showFilters && (
            <div className="mb-4 md:mb-6 space-y-4 md:space-y-6 bg-white border border-gray-200 rounded-lg p-4 md:p-6">
              {/* Categories */}
              <div>
                <p className="text-xs md:text-sm font-semibold text-gray-700 mb-2">Category</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setCurrentPage(1)
                    }}
                    className="px-3 md:px-4 py-2 rounded text-white font-semibold transition-colors text-sm md:text-base"
                    style={{ backgroundColor: '#F80000' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C62221')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F80000')}
                  >
                    All
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id)
                        setCurrentPage(1)
                      }}
                      className={`px-3 md:px-4 py-2 rounded font-semibold transition-colors text-xs md:text-sm ${
                        selectedCategory === cat.id
                          ? 'bg-white border-2'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                      style={selectedCategory === cat.id ? { borderColor: '#F80000', color: '#F80000' } : {}}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-gray-700">Price range</span>
                  <span className="font-semibold" style={{ color: '#F80000' }}>
                    {formatPrice(priceRange[0])} – {formatPrice(priceRange[1])}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative h-5 flex items-center flex-grow">
                    <div className="absolute w-full h-1 bg-gray-200 rounded" />
                    <div
                      className="absolute h-1 rounded"
                      style={{
                        backgroundColor: '#F80000',
                        left: `${((priceRange[0] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                        right: `${100 - ((priceRange[1] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                      }}
                    />
                    <input
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={PRICE_STEP}
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = Math.min(Number(e.target.value), priceRange[1] - PRICE_STEP)
                        setPriceRange([value, priceRange[1]])
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#F80000] [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#F80000] [&::-moz-range-thumb]:cursor-pointer"
                      aria-label="Minimum price"
                    />
                    <input
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={PRICE_STEP}
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = Math.max(Number(e.target.value), priceRange[0] + PRICE_STEP)
                        setPriceRange([priceRange[0], value])
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#F80000] [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#F80000] [&::-moz-range-thumb]:cursor-pointer"
                      aria-label="Maximum price"
                    />
                  </div>
                  <button
                    onClick={applyPriceFilter}
                    className="px-3 md:px-4 py-2 rounded text-white font-semibold transition-colors text-xs md:text-sm whitespace-nowrap"
                    style={{ backgroundColor: '#F80000' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C62221')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F80000')}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            placeholder="Search for a product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F80000] text-sm md:text-base"
          />
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {Array.from({ length: 6 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <p className="text-center text-red-600 py-12">{error}</p>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    category={product.category?.name}
                    image={getPrimaryImage(product)}
                    description={product.description}
                    price={product.price}
                    createdAt={product.created_at}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 md:mt-12 flex-wrap">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 md:px-4 py-2 rounded border border-gray-300 disabled:opacity-50 text-sm md:text-base"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 md:px-4 py-2 rounded font-semibold transition-colors text-sm md:text-base ${
                        currentPage === page
                          ? 'text-white'
                          : 'border border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                      style={currentPage === page ? { backgroundColor: '#F80000' } : {}}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No products found</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded text-white font-semibold transition-colors"
                style={{ backgroundColor: '#F80000' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C62221')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F80000')}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: '#F80000' }} className="text-white py-16">
        <div className="container text-center">
          <h2 className="font-heading text-4xl font-bold mb-4">Need a Custom Solution?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Our experts will guide you through defining your technical needs to create the
            perfect interactive solution for your organization.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/contact"
              className="px-6 py-3 rounded font-semibold transition-colors"
              style={{ backgroundColor: 'white', color: '#F80000' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Contact an Expert
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded border-2 border-white font-semibold transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Download Catalog
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}