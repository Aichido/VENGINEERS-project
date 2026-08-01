import { Link } from 'react-router-dom'
import { Mail, Share2, MessageCircle } from 'lucide-react'

const COLORS = {
  primary: '#F80000',
  primaryHover: '#C62221',
  gold: '#ECB115',
}

const navLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/produits', label: 'Nos produits' },
  { to: '/services', label: 'Nos services' },
  { to: '/contact', label: 'Contact' },
]

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#000000' }} className="text-white py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* À propos */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Vengineers</h3>
            <p className="text-gray-400 text-sm">
              Spécialiste des solutions d'affichage interactif grand format pour entreprises et institutions.
            </p>
            <Link
              to="/contact"
              className="inline-block mt-4 px-4 py-2 rounded text-white font-semibold transition-colors"
              style={{ backgroundColor: COLORS.primary }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.primaryHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
            >
              Contactez-nous
            </Link>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-base mb-4" style={{ color: COLORS.gold }}>
              CONTACT
            </h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <span style={{ color: COLORS.primary }}>📍</span>
                <p>Plaza Center, Maurice</p>
              </div>
              <div className="flex items-start gap-2">
                <span style={{ color: COLORS.primary }}>📧</span>
                <a href="mailto:contact@vengineers.mu" className="hover:text-white">
                  contact@vengineers.mu
                </a>
              </div>
              <div className="flex items-start gap-2">
                <span style={{ color: COLORS.primary }}>📞</span>
                <a href="tel:+230413000" className="hover:text-white">
                  +230 413 000
                </a>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading font-bold text-base mb-4" style={{ color: COLORS.gold }}>
              NAVIGATION
            </h4>
            <ul className="space-y-2 text-sm">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h4 className="font-heading font-bold text-base mb-4" style={{ color: COLORS.gold }}>
              RÉSEAUX SOCIAUX
            </h4>
            <div className="flex items-center gap-4">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="p-2 rounded border border-gray-600 hover:border-white hover:text-white transition-colors"
              >
                <Mail size={18} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="p-2 rounded border border-gray-600 hover:border-white hover:text-white transition-colors"
              >
                <Share2 size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2 rounded border border-gray-600 hover:border-white hover:text-white transition-colors"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bas de page */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} Vengineers. Tous droits réservés.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="#" className="hover:text-white">
              Politique de confidentialité
            </Link>
            <Link to="#" className="hover:text-white">
              Conditions d'utilisation
            </Link>
            <Link to="/contact" className="hover:text-white">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}