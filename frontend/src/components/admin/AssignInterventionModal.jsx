import { useState } from 'react';
import { X, Loader2, UserCheck } from 'lucide-react';
import api from '../../services/api';
import UserSearchSelect from './UserSearchSelect';

export default function AssignInterventionModal({ intervention, onClose, onAssigned }) {
  const [technicien, setTechnicien] = useState(
    intervention.technicien ? { id: intervention.technicien.id, name: intervention.technicien.name, email: intervention.technicien.email } : null
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isReassign = intervention.statut === 'assignee';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!technicien) {
      setError('Please select a technician.');
      return;
    }

    setSubmitting(true);
    try {
    const res = await api.post(`/admin/interventions/${encodeURIComponent(intervention.public_id)}/assign`, {
        technicien_id: technicien.id,
      });
      onAssigned(res.data.intervention);
    } catch (err) {
      setError(err.response?.data?.errors?.technicien_id?.[0] || err.response?.data?.message || 'Unable to assign this intervention.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e5e5] bg-[#F7F7F7]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F80000]/10 text-[#F80000]">
              <UserCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{isReassign ? 'Reassign' : 'Assign'} Intervention</h2>
              <p className="text-xs text-[#707070]">{intervention.public_id} · {intervention.titre}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#707070] hover:text-black" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-[#F80000]">{error}</p>}

          <div>
            <label htmlFor="assign-technicien" className="block text-xs font-semibold text-[#707070] mb-1">Technician</label>
            <UserSearchSelect
              id="assign-technicien"
              role="technicien"
              value={technicien}
              onChange={setTechnicien}
              placeholder="Search by name or email…"
            />
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
              {isReassign ? 'Reassign' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}