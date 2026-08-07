import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Clock,
  Wrench as WrenchIcon,
  ShoppingCart,
  Headset,
  FileText,
  Boxes,
  PackageSearch,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

// --- Status label maps -----------------------------------------------
// Backend enums (see ARCHITECTURE-VENGINEERS.md) are French; the UI is
// English everywhere else in the app, so we translate for display only.
const ORDER_STATUS = {
  en_attente: { label: 'Pending', tone: 'bg-[#F7F7F7] text-[#707070]' },
  validee: { label: 'Validated', tone: 'bg-[#ECB115]/20 text-[#8a6b0e]' },
  expediee: { label: 'Shipped', tone: 'bg-[#000a1e]/10 text-[#000a1e]' },
  livree: { label: 'Delivered', tone: 'bg-green-100 text-green-700' },
  annulee: { label: 'Cancelled', tone: 'bg-red-100 text-[#C62221]' },
};

const INTERVENTION_STATUS_ICON = {
  nouvelle: Clock,
  assignee: Clock,
  en_cours: WrenchIcon,
  terminee: Check,
};

function formatPrice(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toLocaleString('en-US')} €` : '—';
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

// Same artificial minimum delay pattern used on Products.jsx / ProductDetail.jsx
// so skeletons don't flash instantly on fast connections.
function withMinDelay(promise, ms = 600) {
  return Promise.all([promise, new Promise((r) => setTimeout(r, ms))]).then(
    ([result]) => result
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [interventions, setInterventions] = useState(null);
  const [error, setError] = useState(false);
  // Remplacer la ligne 93 par une variable d'état initialisée une fois
    const now = useState(() => Date.now())[0];
// Puis utiliser `now` à la place de `Date.now()`

  useEffect(() => {
    let cancelled = false;

    withMinDelay(api.get('/client/orders'))
      .then((res) => {
        if (!cancelled) setOrders(res.data?.data ?? res.data ?? []);
      })
      .catch(() => !cancelled && setError(true));

    withMinDelay(api.get('/client/interventions'))
      .then((res) => {
        if (!cancelled) setInterventions(res.data?.data ?? res.data ?? []);
      })
      .catch(() => !cancelled && setError(true));

    return () => {
      cancelled = true;
    };
  }, []);

  const ordersLoaded = Array.isArray(orders);
  const interventionsLoaded = Array.isArray(interventions);

  const activeOrders = ordersLoaded
    ? orders.filter((o) => !['livree', 'annulee'].includes(o.status))
    : [];
  const totalSpent = ordersLoaded
    ? orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
    : 0;
  const deliveredLast30d = ordersLoaded
    ? orders.filter((o) => {
        if (o.status !== 'livree' || !o.updated_at) return false;
        const days = (now - new Date(o.updated_at).getTime()) / 86400000;
        return days <= 30;
      }).length
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#C62221]">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}
          </p>
          <h1 className="font-['Sora'] text-3xl font-bold text-black md:text-4xl">
            Overview
          </h1>
          <p className="mt-2 max-w-xl text-[#707070]">
            Track your orders in real time and manage your technical interventions
            in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/products"
            className="flex items-center gap-2 rounded-xl bg-[#F80000] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <ShoppingCart size={18} />
            New Order
          </Link>
          <Link
            to="/client/interventions"
            className="flex items-center gap-2 rounded-xl border-2 border-black px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white"
          >
            <Headset size={18} />
            Request Intervention
          </Link>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#C62221]">
          Something went wrong loading your dashboard data. Please try refreshing
          the page.
        </div>
      )}

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Active orders */}
        <div className="flex flex-col gap-4 rounded-xl border border-[#e5e5e5] bg-white p-6 shadow-sm md:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="font-['Sora'] text-lg font-bold text-black">
              Active Orders
            </h2>
            <Link
              to="/client/orders"
              className="text-sm font-semibold text-[#F80000] hover:underline"
            >
              View all
            </Link>
          </div>

          {!ordersLoaded && (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-[#F7F7F7]"
                />
              ))}
            </div>
          )}

          {ordersLoaded && activeOrders.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-[#707070]">
              <PackageSearch size={32} />
              <p>No active orders right now.</p>
              <Link
                to="/products"
                className="text-sm font-semibold text-[#F80000] hover:underline"
              >
                Browse the catalog
              </Link>
            </div>
          )}

          {ordersLoaded && activeOrders.length > 0 && (
            <div className="space-y-3">
              {activeOrders.slice(0, 3).map((order) => {
                const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.en_attente;
                return (
                  <Link
                    to={`/client/orders/${encodeURIComponent(order.public_id)}`}
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-[#e5e5e5] p-4 transition-colors hover:bg-[#F7F7F7]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded bg-[#F7F7F7]">
                        <Boxes size={20} className="text-black" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-black">
                          Order {order.public_id}
                        </p>
                        <p className="text-xs text-[#707070]">
                          {order.items?.length
                            ? `${order.items.length} item(s)`
                            : 'View details'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}
                      >
                        {status.label}
                      </span>
                      <p className="mt-1 text-xs text-[#707070]">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-auto grid grid-cols-3 gap-4 border-t border-[#e5e5e5] pt-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#707070]">
                Total Spent
              </p>
              <p className="font-['Sora'] text-xl font-bold text-black">
                {ordersLoaded ? formatPrice(totalSpent) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#707070]">
                Active
              </p>
              <p className="font-['Sora'] text-xl font-bold text-black">
                {ordersLoaded ? activeOrders.length : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#707070]">
                Delivered (30d)
              </p>
              <p className="font-['Sora'] text-xl font-bold text-black">
                {ordersLoaded ? deliveredLast30d : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Interventions */}
        <div className="flex flex-col rounded-xl border border-[#e5e5e5] bg-white p-6 shadow-sm md:col-span-4">
          <h2 className="mb-6 font-['Sora'] text-lg font-bold text-black">
            Interventions
          </h2>

          {!interventionsLoaded && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-[#F7F7F7]" />
              ))}
            </div>
          )}

          {interventionsLoaded && interventions.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center text-[#707070]">
              <WrenchIcon size={28} />
              <p>No interventions yet.</p>
              <Link
                to="/client/interventions"
                className="text-sm font-semibold text-[#F80000] hover:underline"
              >
                Request one
              </Link>
            </div>
          )}

          {interventionsLoaded && interventions.length > 0 && (
            <div className="relative flex-grow">
              <div className="absolute bottom-0 left-4 top-0 w-px bg-[#e5e5e5]" />
              <div className="relative space-y-6">
                {interventions.slice(0, 3).map((item) => {
                  const Icon = INTERVENTION_STATUS_ICON[item.statut] ?? Clock;
                  const done = item.statut === 'terminee';
                  return (
                    <div className="flex gap-4" key={item.id}>
                      <div
                        className={[
                          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full',
                          done
                            ? 'bg-[#F80000] text-white'
                            : 'bg-[#F7F7F7] text-[#707070]',
                        ].join(' ')}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-black">
                          {item.titre}
                        </p>
                        {item.public_id && (
                          <p className="text-[11px] font-mono text-[#707070]">
                            {item.public_id}
                          </p>
                        )}
                        {item.equipement && (
                          <p className="text-xs text-[#707070]">{item.equipement}</p>
                        )}
                        <p className="text-xs text-[#707070]">
                          {formatDate(item.date_souhaitee)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Link
            to="/client/interventions"
            className="mt-6 w-full rounded-lg border border-[#e5e5e5] py-2.5 text-center text-sm font-semibold text-[#707070] transition-colors hover:bg-[#F7F7F7]"
          >
            Full history
          </Link>
        </div>

        {/* Quick actions — replaces the admin-oriented tiles from the
            mockup (API Integration, System Logs...) with things a
            B2B client actually needs. */}
        <div className="grid grid-cols-1 gap-4 md:col-span-12 md:grid-cols-3">
          <Link
            to="/services"
            className="flex items-center gap-4 rounded-xl bg-white border border-[#e5e5e5] p-5 transition-colors hover:bg-[#F7F7F7]"
          >
            <FileText size={28} className="text-[#F80000]" />
            <div>
              <p className="text-sm font-semibold text-black">Technical Guides</p>
              <p className="text-xs text-[#707070]">Specs, manuals, schematics</p>
            </div>
          </Link>
          <Link
            to="/client/orders"
            className="flex items-center gap-4 rounded-xl bg-white border border-[#e5e5e5] p-5 transition-colors hover:bg-[#F7F7F7]"
          >
            <Boxes size={28} className="text-[#F80000]" />
            <div>
              <p className="text-sm font-semibold text-black">Order History</p>
              <p className="text-xs text-[#707070]">Invoices &amp; past orders</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}