// Header.jsx — version corrigée
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartModal from './CartModal';
import { DASHBOARD_PATH_BY_ROLE } from '../constants/roles';

const COLORS = {
  primary: '#BC0100',
  primaryHover: '#C62221',
};

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/products', label: 'Products' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
];

// Composant extrait en dehors du composant principal
const CartButton = ({ totalItems, onClick }) => (
  <button
    onClick={onClick}
    className="relative p-2"
    aria-label="View cart"
  >
    <ShoppingCart size={22} className="text-gray-700" />
    {totalItems > 0 && (
      <span
        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
        style={{ backgroundColor: COLORS.primary }}
      >
        {totalItems}
      </span>
    )}
  </button>
);

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const { totalItems } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const isActive = (to) => location.pathname === to;
  const dashboardPath = DASHBOARD_PATH_BY_ROLE[user?.role?.name] || '/';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="container flex items-center justify-between py-3 md:py-4">
        <Link to="/" className="font-heading font-bold text-xl md:text-2xl flex-shrink-0">
          <span style={{ color: COLORS.primary }}>Vengineers</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center gap-6">
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

          <CartButton totalItems={totalItems} onClick={() => setIsCartOpen(true)} />

          <Link
            to={user ? dashboardPath : '/login'}
            className="px-4 md:px-6 py-2 rounded text-white font-semibold transition-colors text-sm md:text-base flex-shrink-0"
            style={{ backgroundColor: COLORS.primary }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.primaryHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
          >
            {user ? 'My Space' : 'Request a Quote'}
          </Link>
        </div>

        {/* Mobile: cart button + menu button */}
        <div className="lg:hidden flex items-center gap-1">
          <CartButton totalItems={totalItems} onClick={() => setIsCartOpen(true)} />
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
        <div className="lg:hidden border-t border-gray-200 bg-white">
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
              to={user ? dashboardPath : '/login'}
              onClick={() => setIsOpen(false)}
              className="block w-full text-center px-4 py-2 rounded text-white font-semibold transition-colors mt-4"
              style={{ backgroundColor: COLORS.primary }}
            >
              {user ? 'My Space' : 'Request a Quote'}
            </Link>
          </div>
        </div>
      )}

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}