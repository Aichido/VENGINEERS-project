import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Share2, ShoppingCart, Check } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import ProductDetailSkeleton from '../../components/ProductDetailSkeleton'
import { getGalleryImages, getPrimaryImage } from '../../lib/productImage'
import { formatPrice } from '../../lib/formatPrice'
import api from '../../services/api'

import { useCart } from '../../context/CartContext'

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000

export default function ProductDetail() {
  const { id } = useParams()
  // Remounting the view whenever `id` changes (via `key`) gives every piece
  // of state its fresh initial value for free — loading starts back at
  // true, notFound/error/selectedImage reset to their defaults — instead of
  // resetting them synchronously inside an effect (react-hooks/set-state-in-effect).
  return <ProductDetailView key={id} id={id} />
}

function ProductDetailView({ id }) {
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(null)

  const [selectedImage, setSelectedImage] = useState(0)

  const [shareLabel, setShareLabel] = useState('Share')

  // Lazy initial state: the initializer runs once, on mount of this
  // specific product's view (i.e. once per `id`, thanks to the remount
  // above), instead of calling the impure Date.now() during every render.
  const [now] = useState(() => Date.now())

  //cart
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1000))

    Promise.all([api.get(`/products/${id}`), minDelay])
      .then(([res]) => {
        setProduct(res.data)
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setNotFound(true)
        } else {
          console.error('Failed to fetch product:', err)
          setError('Unable to load this product right now. Please try again shortly.')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  // Fetch related products once the main product is known
  useEffect(() => {
    if (!product?.category?.id) {
      return
    }

    api
      .get('/products', { params: { category: product.category.id, per_page: 4 } })
      .then((res) => {
        const items = (res.data.data || []).filter((p) => p.id !== product.id).slice(0, 3)
        setRelatedProducts(items)
      })
      .catch(() => setRelatedProducts([]))
  }, [product])

  if (loading) {
    return <ProductDetailSkeleton />
  }

  if (notFound) {
    return (
      <main>
        <section className="py-20">
          <div className="container text-center">
            <h1 className="font-heading text-4xl font-bold mb-4">Product not found</h1>
            <Link
              to="/products"
              className="inline-block px-6 py-3 rounded text-white font-semibold"
              style={{ backgroundColor: '#F80000' }}
            >
              Back to Products
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main>
        <section className="py-20">
          <div className="container text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </section>
      </main>
    )
  }

  const images = getGalleryImages(product)
  const isNew = product.created_at
    ? now - new Date(product.created_at).getTime() < ONE_MONTH_MS
    : false

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0],
      stock_qty: product.stock_qty,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareLabel('Link copied!')
      setTimeout(() => setShareLabel('Share'), 2000)
    } catch {
      // Clipboard not available — silently ignore, button stays as-is
    }
  }

  return (
    <main>
      {/* Breadcrumb */}
      <section className="bg-gray-50 py-4 md:py-6">
        <div className="container">
          <div className="flex items-center gap-2 text-sm md:text-base flex-wrap">
            <Link to="/products" className="text-gray-600 hover:text-gray-900 transition-colors">
              Products
            </Link>
            {product.category && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">{product.category.name}</span>
              </>
            )}
            <span className="text-gray-400">/</span>
            <span className="font-semibold text-gray-900">{product.name}</span>
          </div>
        </div>
      </section>

      {/* Product Detail */}
      <section className="py-12 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-20">
            {/* Gallery */}
            <div>
              <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden bg-gray-100 mb-4">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {isNew && (
                  <div
                    className="absolute top-4 right-4 px-3 py-1 rounded text-white text-xs font-bold"
                    style={{ backgroundColor: '#F80000' }}
                  >
                    NEW
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors"
                      style={{ borderColor: selectedImage === idx ? '#F80000' : 'transparent' }}
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {product.category && (
                <div className="mb-4">
                  <span
                    className="inline-block px-3 py-1 rounded text-xs md:text-sm font-bold text-black"
                    style={{ backgroundColor: '#ECB115' }}
                  >
                    {product.category.name}
                  </span>
                </div>
              )}

              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {product.name}
              </h1>

              <p className="font-heading text-2xl md:text-3xl font-bold mb-6" style={{ color: '#F80000' }}>
                {formatPrice(product.price)}
              </p>

              <p className="text-gray-600 text-base md:text-lg mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_qty === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded font-semibold transition-colors text-sm md:text-base text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: added ? '#10b981' : '#F80000' }}
                  onMouseEnter={(e) => product.stock_qty !== 0 && !added && (e.currentTarget.style.backgroundColor = '#C62221')}
                  onMouseLeave={(e) => product.stock_qty !== 0 && !added && (e.currentTarget.style.backgroundColor = '#F80000')}
                >
                  {added ? <Check size={20} /> : <ShoppingCart size={20} />}
                  <span>
                    {product.stock_qty === 0 ? 'Out of stock' : added ? 'Added to cart' : 'Add to Cart'}
                  </span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded border-2 border-gray-300 font-semibold transition-colors hover:border-gray-400 text-gray-700 text-sm md:text-base"
                >
                  <Share2 size={20} />
                  <span>{shareLabel}</span>
                </button>
              </div>

              {/* Contact CTA */}
              <Link
                to="/contact"
                className="block text-center px-6 md:px-8 py-3 md:py-4 rounded font-semibold transition-colors text-sm md:text-base"
                style={{ backgroundColor: '#F80000', color: '#fff' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C62221')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F80000')}
              >
                Request a Quote
              </Link>
            </div>
          </div>

          {/* Additional Details */}
          <div className="border-t border-gray-200 pt-12 md:pt-20 mb-12 md:mb-20">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-6 md:mb-8">
              About This Product
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <h3 className="font-heading font-bold text-lg md:text-xl mb-3">Benefits</h3>
                <ul className="space-y-3">
                  {[
                    'Cutting-edge and reliable technology',
                    '24/7 technical support included',
                    'Installation and integration available',
                    'Optional preventive maintenance',
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span style={{ color: '#F80000' }} className="text-lg flex-shrink-0">
                        •
                      </span>
                      <span className="text-gray-600 text-sm md:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-heading font-bold text-lg md:text-xl mb-3">Delivery & Warranty</h3>
                <ul className="space-y-3">
                  {[
                    'Delivery within 5-7 business days',
                    '2-year parts and labor warranty',
                    'Free installation included',
                    'User training provided',
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span style={{ color: '#F80000' }} className="text-lg flex-shrink-0">
                        •
                      </span>
                      <span className="text-gray-600 text-sm md:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-heading text-2xl md:text-3xl font-bold">Related Products</h2>
                <Link
                  to="/products"
                  className="text-sm md:text-base font-semibold transition-colors"
                  style={{ color: '#F80000' }}
                >
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
               {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    category={p.category?.name}
                    image={getPrimaryImage(p)}
                    description={p.description}
                    price={p.price}
                    createdAt={p.created_at}
                    stockQty={p.stock_qty}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ backgroundColor: '#F80000' }} className="text-white py-12 md:py-20">
        <div className="container text-center">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
            Have Any Questions?
          </h2>
          <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Our expert team is here to help you choose the best product for your needs.
          </p>
          <Link
            to="/contact"
            className="inline-block px-6 md:px-8 py-3 md:py-4 rounded font-semibold transition-colors"
            style={{ backgroundColor: 'white', color: '#F80000' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Contact Our Team
          </Link>
        </div>
      </section>
    </main>
  )
}