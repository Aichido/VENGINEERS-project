import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const COLORS = {
  primary: '#BC0100',
  primaryHover: '#C62221',
}

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/products', label: 'Products' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
]

export default function Header() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (to) => location.pathname === to

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="container flex items-center justify-between py-3 md:py-4">
        <Link to="/" className="font-heading font-bold text-xl md:text-2xl flex-shrink-0">
          <span style={{ color: COLORS.primary }}>Vengineers</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? link.to === '/contact'
                      ? 'text-[#F80000]'
                      : 'text-gray-900 border-b-2'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={isActive(link.to) && link.to !== '/contact' ? { borderColor: COLORS.primary } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link
            to="/login"
            className="px-4 md:px-6 py-2 rounded text-white font-semibold transition-colors text-sm md:text-base flex-shrink-0"
            style={{ backgroundColor: COLORS.primary }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.primaryHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
          >
            Request a Quote
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`block text-base font-medium py-2 transition-colors ${
                  isActive(link.to)
                    ? link.to === '/contact'
                      ? 'text-[#F80000]'
                      : 'text-gray-900'
                    : 'text-gray-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center px-4 py-2 rounded text-white font-semibold transition-colors mt-4"
              style={{ backgroundColor: COLORS.primary }}
            >
              Request a Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
