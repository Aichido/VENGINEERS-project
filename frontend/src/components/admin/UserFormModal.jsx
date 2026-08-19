import { useEffect, useState } from 'react';
import { X, Loader2, UserPlus } from 'lucide-react';
import api from '../../services/api';
import { STAFF_ROLE_OPTIONS, ROLE_LABELS, ROLE_AVATAR_TONE, initials } from '../../constants/adminStats';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'commercial', phone: '', address: '' };

export default function UserFormModal({ user, onClose, onSaved }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise le formulaire avec l'utilisateur sélectionné, pas de cascade de rendus réelle ici
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role?.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setGeneralError('');
  }, [user]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError('');

    try {
      if (isEdit) {
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          address: form.address || null,
        };
        if (form.password) payload.password = form.password;

        const res = await api.put(`/admin/users/${user.id}`, payload);
        onSaved(res.data);
      } else {
        const res = await api.post('/admin/users', form);
        onSaved(res.data);
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setGeneralError('Unable to save this user.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const avatarTone = ROLE_AVATAR_TONE[form.role] || 'bg-[#707070]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e5e5] bg-[#F7F7F7]">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${avatarTone}`}>
              {form.name ? initials(form.name) : <UserPlus size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{isEdit ? 'Edit User' : 'New Staff User'}</h2>
              <p className="text-xs text-[#707070]">{isEdit ? user.email : 'Create a commercial, technician or admin account'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#707070] hover:text-black" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {generalError && <p className="text-sm text-[#F80000]">{generalError}</p>}

          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#707070]">Account Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="user-name" className="block text-xs font-semibold text-[#707070] mb-1">Full Name</label>
                <input
                  id="user-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
                  required
                />
                {errors.name && <p className="mt-1 text-xs text-[#F80000]">{errors.name[0]}</p>}
              </div>

              {isEdit ? (
                <div>
                  <span className="block text-xs font-semibold text-[#707070] mb-1">Role</span>
                  <p className="text-sm text-black py-2">{ROLE_LABELS[user.role?.name] || user.role?.name}</p>
                  <p className="text-xs text-[#707070]">Role cannot be changed after creation.</p>
                </div>
              ) : (
                <div>
                  <label htmlFor="user-role" className="block text-xs font-semibold text-[#707070] mb-1">Role</label>
                  <select
                    id="user-role"
                    value={form.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
                  >
                    {STAFF_ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  {errors.role && <p className="mt-1 text-xs text-[#F80000]">{errors.role[0]}</p>}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="user-email" className="block text-xs font-semibold text-[#707070] mb-1">Email</label>
              <input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
                required
              />
              {errors.email && <p className="mt-1 text-xs text-[#F80000]">{errors.email[0]}</p>}
            </div>

            <div>
              <label htmlFor="user-password" className="block text-xs font-semibold text-[#707070] mb-1">
                Password {isEdit && <span className="font-normal normal-case text-[#707070]">(leave blank to keep current)</span>}
              </label>
              <input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
                required={!isEdit}
              />
              {errors.password && <p className="mt-1 text-xs text-[#F80000]">{errors.password[0]}</p>}
              <p className="mt-1 text-xs text-[#707070]">Min. 8 characters, upper &amp; lower case, a number and a symbol.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#707070]">Contact Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="user-phone" className="block text-xs font-semibold text-[#707070] mb-1">Phone</label>
                <input
                  id="user-phone"
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
                />
              </div>
              <div>
                <label htmlFor="user-address" className="block text-xs font-semibold text-[#707070] mb-1">Address</label>
                <input
                  id="user-address"
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#e5e5e5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#e5e5e5] text-[#707070] hover:text-black hover:bg-[#F7F7F7] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#F80000] text-white hover:bg-[#C62221] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}