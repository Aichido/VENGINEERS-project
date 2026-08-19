import { useEffect, useState } from 'react';
import { Loader2, Wallet, CalendarDays, ShoppingBag, Wrench, Users, Bell, Package } from 'lucide-react';
import api from '../../../services/api';
import { ORDER_STATUS } from '../../../constants/orderStatus';
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  PRIORITY_TONE,
  ROLE_LABELS,
  ROLE_ORDER,
  muCurrency,
} from '../../../constants/adminStats';

const ORDER_STATUS_ORDER = ['en_attente', 'validee', 'expediee', 'livree', 'annulee'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [notifications, setNotifications] = useState(null);
  const [notifLoading, setNotifLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
     // eslint-disable-next-line react-hooks/set-state-in-effect -- charge une fois au montage, pas de cascade de rendus réelle ici
    setLoading(true);
    setError('');

    api
      .get('/admin/stats')
      .then((res) => { if (!cancelled) setStats(res.data); })
      .catch(() => { if (!cancelled) setError('Unable to load dashboard statistics.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  function loadNotifications() {
    setNotifLoading(true);
    api
      .get('/admin/notifications')
      .then((res) => setNotifications(res.data.data))
      .catch(() => setNotifications([]))
      .finally(() => setNotifLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- charge une fois au montage, pas de cascade de rendus réelle ici
    loadNotifications();
  }, []);

  async function handleMarkAsRead(notification) {
    setMarkingId(notification.id);
    try {
      await api.patch(`/admin/notifications/${notification.id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } finally {
      setMarkingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#F80000]" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[#F80000]">{error}</p>;
  }

  const commandesParStatut = stats.commandes_par_statut || {};
  const interventionsParPriorite = stats.interventions_ouvertes_par_priorite || {};
  const utilisateursParRole = stats.utilisateurs_par_role || {};
  const unreadCount = (notifications || []).filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Overview</h1>
        <p className="text-sm text-[#707070]">Global statistics across the platform.</p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F80000]/10 text-[#F80000]">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#707070]">Total Revenue</p>
            <p className="text-2xl font-bold text-black">{muCurrency.format(stats.ca_total)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ECB115]/20 text-[#8a6b0e]">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#707070]">Revenue — Current Month</p>
            <p className="text-2xl font-bold text-black">{muCurrency.format(stats.ca_mois_en_cours)}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-[#707070]" />
          <h2 className="text-sm font-bold text-black">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F80000] text-white">
              {unreadCount} unread
            </span>
          )}
        </div>

        {notifLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#F80000]" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <ul className="divide-y divide-[#e5e5e5]">
            {notifications.map((notification) => {
              const isUnread = !notification.read_at;
              return (
                <li key={notification.id} className={`py-3 flex items-start justify-between gap-3 ${isUnread ? '' : 'opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ECB115]/20 text-[#8a6b0e] mt-0.5">
                      <Package size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-black">{notification.data?.message || 'Notification'}</p>
                      <p className="text-xs text-[#707070]">{new Date(notification.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(notification)}
                      disabled={markingId === notification.id}
                      className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold border border-[#e5e5e5] text-[#707070] hover:text-black hover:bg-[#F7F7F7] disabled:opacity-50 transition-colors"
                    >
                      Mark as read
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-[#707070]">No notifications.</p>
        )}
      </div>

      {/* Orders by status */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag size={18} className="text-[#707070]" />
          <h2 className="text-sm font-bold text-black">Orders by Status</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {ORDER_STATUS_ORDER.map((key) => (
            <div key={key} className="rounded-lg border border-[#e5e5e5] p-3 text-center">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${ORDER_STATUS[key]?.tone || ''}`}>
                {ORDER_STATUS[key]?.label || key}
              </span>
              <p className="text-xl font-bold text-black">{commandesParStatut[key] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Open interventions by priority */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={18} className="text-[#707070]" />
          <h2 className="text-sm font-bold text-black">Open Interventions by Priority</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRIORITY_ORDER.map((key) => (
            <div key={key} className="rounded-lg border border-[#e5e5e5] p-3 text-center">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${PRIORITY_TONE[key]}`}>
                {PRIORITY_LABELS[key]}
              </span>
              <p className="text-xl font-bold text-black">{interventionsParPriorite[key] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Users by role */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-[#707070]" />
          <h2 className="text-sm font-bold text-black">Users by Role</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ROLE_ORDER.map((key) => (
            <div key={key} className="rounded-lg border border-[#e5e5e5] p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#707070] mb-2">{ROLE_LABELS[key]}</p>
              <p className="text-xl font-bold text-black">{utilisateursParRole[key] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}