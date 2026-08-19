import { useState } from 'react';
import { X, Loader2, Wrench } from 'lucide-react';
import api from '../../services/api';
import UserSearchSelect from './UserSearchSelect';
import { PRIORITY_LABELS, PRIORITY_ORDER } from '../../constants/adminStats';

const EMPTY_FORM = { titre: '', description: '', equipement: '', priorite: 'normale', date_souhaitee: '' };

export default function InterventionFormModal({ onClose, onCreated }) {
  const [client, setClient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    if (!client) {
      setErrors({ client_id: ['Please select a client.'] });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/admin/interventions', {
        client_id: client.id,
        titre: form.titre,
        description: form.description,
        equipement: form.equipement || null,
        priorite: form.priorite,
        date_souhaitee: form.date_souhaitee || null,
      });
      onCreated(res.data);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setGeneralError('Unable to create this intervention.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e5e5] bg-[#F7F7F7]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F80000]/10 text-[#F80000]">
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">New Intervention</h2>
              <p className="text-xs text-[#707070]">Create a ticket on behalf of an existing client</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#707070] hover:text-black" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {generalError && <p className="text-sm text-[#F80000]">{generalError}</p>}

          <div>
            <label htmlFor="intervention-client" className="block text-xs font-semibold text-[#707070] mb-1">Client</label>
            <UserSearchSelect
              id="intervention-client"
              role="client"
              value={client}
              onChange={setClient}
              placeholder="Search by name or email…"
            />
            {errors.client_id && <p className="mt-1 text-xs text-[#F80000]">{errors.client_id[0]}</p>}
          </div>

          <div>
            <label htmlFor="intervention-titre" className="block text-xs font-semibold text-[#707070] mb-1">Title</label>
            <input
              id="intervention-titre"
              type="text"
              value={form.titre}
              onChange={(e) => handleChange('titre', e.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
              required
            />
            {errors.titre && <p className="mt-1 text-xs text-[#F80000]">{errors.titre[0]}</p>}
          </div>

          <div>
            <label htmlFor="intervention-description" className="block text-xs font-semibold text-[#707070] mb-1">Description</label>
            <textarea
              id="intervention-description"
              rows={3}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
              required
            />
            {errors.description && <p className="mt-1 text-xs text-[#F80000]">{errors.description[0]}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="intervention-equipement" className="block text-xs font-semibold text-[#707070] mb-1">Equipment</label>
              <input
                id="intervention-equipement"
                type="text"
                value={form.equipement}
                onChange={(e) => handleChange('equipement', e.target.value)}
                className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
              />
              {errors.equipement && <p className="mt-1 text-xs text-[#F80000]">{errors.equipement[0]}</p>}
            </div>

            <div>
              <label htmlFor="intervention-priorite" className="block text-xs font-semibold text-[#707070] mb-1">Priority</label>
              <select
                id="intervention-priorite"
                value={form.priorite}
                onChange={(e) => handleChange('priorite', e.target.value)}
                className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
              >
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
              {errors.priorite && <p className="mt-1 text-xs text-[#F80000]">{errors.priorite[0]}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="intervention-date" className="block text-xs font-semibold text-[#707070] mb-1">Requested Date</label>
            <input
              id="intervention-date"
              type="date"
              value={form.date_souhaitee}
              onChange={(e) => handleChange('date_souhaitee', e.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
            />
            {errors.date_souhaitee && <p className="mt-1 text-xs text-[#F80000]">{errors.date_souhaitee[0]}</p>}
          </div>

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
              Create Intervention
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}