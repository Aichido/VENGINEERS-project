import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Power, Trash2, Briefcase, Wrench, Search } from 'lucide-react';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';
import UserFormModal from '../../../components/admin/UserFormModal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useAuth } from '../../../context/AuthContext';
import {
  ROLE_LABELS,
  ROLE_ORDER,
  ROLE_BADGE_TONE,
  ROLE_AVATAR_TONE,
  initials,
} from '../../../constants/adminStats';
import { useToast } from '../../../context/ToastContext';

const ROLE_TABS = [{ value: '', label: 'All Roles' }, ...ROLE_ORDER.map((r) => ({ value: r, label: ROLE_LABELS[r] }))];
const STATUS_TABS = [
  { value: '', label: 'All Staff' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function Users() {
  const { user: currentUser } = useAuth();

  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalUser, setModalUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rowBusyId, setRowBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
   const { showToast } = useToast();

  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let cancelled = false;
      setLoading(true);
      setError('');

      api
        .get('/admin/users', { params: { role: role || undefined, search: search || undefined, page } })
        .then((res) => { if (!cancelled) setData(res.data); })
        .catch(() => { if (!cancelled) setError('Unable to load users.'); })
        .finally(() => { if (!cancelled) setLoading(false); });

      return () => { cancelled = true; };
    }, search ? 400 : 0);

    return () => clearTimeout(timeout);
  }, [role, search, page]);

  function openCreate() {
    setModalUser(null);
    setModalOpen(true);
  }

  function openEdit(user) {
    setModalUser(user);
    setModalOpen(true);
  }

  function handleSaved(savedUser) {
    setModalOpen(false);
    showToast(modalUser ? 'User updated successfully.' : 'User created successfully.');
    setData((prev) => {
      if (!prev) return prev;
      const exists = prev.data.some((u) => u.id === savedUser.id);
      return {
        ...prev,
        data: exists
          ? prev.data.map((u) => (u.id === savedUser.id ? savedUser : u))
          : [savedUser, ...prev.data],
      };
    });
  }

  async function handleToggleActive(user) {
    setRowBusyId(user.id);
    try {
      const res = await api.patch(`/admin/users/${user.id}/toggle-active`);
      setData((prev) => ({
        ...prev,
        data: prev.data.map((u) => (u.id === user.id ? res.data : u)),
      }));
    } catch {
      setError('Unable to update this user.');
    } finally {
      setRowBusyId(null);
    }
  }

  async function confirmDelete() {
    const user = deleteTarget;
    if (!user) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${user.id}`);
      setData((prev) => ({ ...prev, data: prev.data.filter((u) => u.id !== user.id) }));
      setDeleteTarget(null);
      showToast('User deleted successfully.');
    } catch {
      setError('Unable to delete this user.');
    } finally {
      setDeleting(false);
    }
  }

  // Jamais afficher l'admin actuellement connecté dans la liste — filtre
  // client-side uniquement, la pagination reflète le total serveur (peut
  // donc afficher un item de moins que le compteur "Showing X of Y" sur la
  // page où figure l'admin courant).
  const visibleUsers = (data?.data || []).filter((u) => u.id !== currentUser?.id);
  const filteredUsers =
    status === ''
      ? visibleUsers
      : visibleUsers.filter((u) => (status === 'active' ? u.is_active : !u.is_active));

  const commercialCount = stats?.utilisateurs_par_role?.commercial ?? '—';
  const technicienCount = stats?.utilisateurs_par_role?.technicien ?? '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Users</h1>
          <p className="text-sm text-[#707070]">Manage staff accounts and view all platform users.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#F80000] text-white hover:bg-[#C62221] transition-colors"
        >
          <Plus size={16} />
          New Staff User
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#707070]">Commercial</p>
            <p className="text-2xl font-bold text-black">{commercialCount} <span className="text-sm font-medium text-[#707070]">members</span></p>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-purple-700">
            <Wrench size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#707070]">Technicians</p>
            <p className="text-2xl font-bold text-black">{technicienCount} <span className="text-sm font-medium text-[#707070]">field operators</span></p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || 'all'}
              onClick={() => setStatus(tab.value)}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors',
                status === tab.value
                  ? 'bg-black text-white'
                  : 'bg-white text-[#707070] border border-[#e5e5e5] hover:text-black',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#707070]"
        >
          {ROLE_TABS.map((tab) => (
            <option key={tab.value || 'all'} value={tab.value}>{tab.label}</option>
          ))}
        </select>

        <div className="relative ml-auto w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707070]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-[#e5e5e5] pl-9 pr-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#F80000]" />
        </div>
      )}

      {!loading && error && <p className="text-sm text-[#F80000]">{error}</p>}

      {!loading && !error && data && (
        <>
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-[#707070]">No users found.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#707070] border-b border-[#e5e5e5] bg-[#F7F7F7]">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const roleName = user.role?.name;
                    return (
                      <tr key={user.id} className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#F7F7F7]/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${ROLE_AVATAR_TONE[roleName] || 'bg-[#707070]'}`}>
                              {initials(user.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-black">{user.name}</p>
                              <p className="text-xs text-[#707070]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_BADGE_TONE[roleName] || ''}`}>
                            {ROLE_LABELS[roleName] || roleName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#707070]">{user.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                            <span className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-[#707070]'}`} />
                            <span className={user.is_active ? 'text-green-700' : 'text-[#707070]'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(user)}
                              title="Edit"
                              className="p-2 rounded-lg text-[#707070] hover:text-black hover:bg-[#F7F7F7] transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={rowBusyId === user.id}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                              className="p-2 rounded-lg text-[#707070] hover:text-black hover:bg-[#F7F7F7] disabled:opacity-50 transition-colors"
                            >
                              <Power size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(user)}
                              title="Delete"
                              className="p-2 rounded-lg text-[#F80000] hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2 text-xs text-[#707070] border-t border-[#e5e5e5] bg-[#F7F7F7]">
                Showing {filteredUsers.length} of {data.total} users
              </div>
            </div>
          )}

          <Pagination page={page} lastPage={data.last_page} onPageChange={setPage} />
        </>
      )}

      {modalOpen && (
        <UserFormModal user={modalUser} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete user"
          message={`Delete ${deleteTarget.name}? This preserves their order/intervention history but blocks their email from reuse.`}
          confirmLabel="Delete"
          submitting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}