import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Wrench,
  ShoppingCart,
  Store,
  Package,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Users,
 FolderTree,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';


// Navigation par rôle. Les items Admin-only du mockup d'origine (User
// Management, Product Catalog CRUD, System Logs, "Generate Report",
// "Create Account") restent hors scope tant que la Phase 6 (Admin) n'est
// pas commencée.
const NAV_ITEMS_BY_ROLE = {
  client: [
    { to: '/client', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/client/orders', label: 'My Orders', icon: ShoppingBag },
    { to: '/client/interventions', label: 'Interventions', icon: Wrench },
  ],
  commercial: [
    { to: '/commercial', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/commercial/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/commercial/stock', label: 'Stock', icon: Package },
  ],
  technicien: [
    { to: '/technicien', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/technicien/interventions', label: 'Interventions', icon: Wrench },
    { to: '/technicien/reports', label: 'Report History', icon: ClipboardList },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree },
    { to: '/admin/interventions', label: 'Interventions', icon: Wrench },
    { to: '/admin/reports', label: 'Reports', icon: ClipboardList },
  ],
 };
 
const SPACE_LABEL_BY_ROLE = {
  client: 'Client Space',
  commercial: 'Commercial Space',
  technicien: 'Technician Space',
  admin: 'Admin Space',
};


function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const role = user?.role?.name;
  const navItems = NAV_ITEMS_BY_ROLE[role] || [];
  const spaceLabel = SPACE_LABEL_BY_ROLE[role] || 'Dashboard';

  const navLinkClasses = ({ isActive }) =>
    [
      'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors',
      isActive
        ? 'bg-[#BC0100] text-white'
        : 'text-[#707070] hover:text-black hover:bg-[#F7F7F7]',
    ].join(' ');

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Sidebar */}
      <aside
        className={[
          'fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-auto',
          'bg-white border-r border-[#e5e5e5] py-8 px-4',
          'transition-transform duration-300 md:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="mb-8 px-2 flex items-center justify-between">
          <div>
            <div className="font-['Sora'] text-xl font-bold text-black">
              Vengineers
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#707070]">
              {spaceLabel}
            </div>
          </div>
          <button
            className="md:hidden text-[#707070]"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-grow space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClasses}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}

          {/* Cart et Browse Catalog restent réservés au Client — un
              Commercial ne passe pas commande pour lui-même. */}
          {role === 'client' && (
            <>
              <NavLink to="/cart" className={navLinkClasses}>
                <span className="relative">
                  <ShoppingCart size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#ECB115] text-[10px] font-bold text-black">
                      {totalItems}
                    </span>
                  )}
                </span>
                <span>Cart</span>
              </NavLink>

              <NavLink to="/products" className={navLinkClasses}>
                <Store size={20} />
                <span>Browse Catalog</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="mt-4 space-y-1 border-t border-[#e5e5e5] pt-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#707070] hover:text-black hover:bg-[#F7F7F7] transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMobileNavOpen(false); } }}
          aria-label="Close menu"
        />
      )}

      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b border-[#e5e5e5] bg-white pl-4 pr-4 md:pl-[19rem] md:pr-8">
        <button
          className="text-[#707070] md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="hidden md:block text-sm text-[#707070]">
          Welcome back, <span className="font-semibold text-black">{user?.name}</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wide text-[#707070]">
            {user?.role?.name}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F80000] text-sm font-bold text-white">
            {initials(user?.name)}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="min-h-screen pt-16 md:pl-72 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}