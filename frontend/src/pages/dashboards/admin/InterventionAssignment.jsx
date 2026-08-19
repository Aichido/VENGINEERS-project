import { useEffect, useState } from 'react';
import { Loader2, Plus, UserCheck, Lock, CalendarClock } from 'lucide-react';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';
import InterventionFormModal from '../../../components/admin/InterventionFormModal';
import AssignInterventionModal from '../../../components/admin/AssignInterventionModal';
import { useToast } from '../../../context/ToastContext';
import { STATUS_BADGE, STATUS_LABEL, PRIORITY_BADGE } from '../../../constants/interventionStatus';
import { PRIORITY_LABELS, PRIORITY_ORDER } from '../../../constants/adminStats';
import { ADMIN_STATUS_TABS, ASSIGNABLE_STATUSES } from '../../../constants/adminInterventions';

export default function InterventionAssignment() {
  const { showToast } = useToast();

  const [statut, setStatut] = useState('');
  const [priorite, setPriorite] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenche le chargement suite à un changement de filtre/page, pas de cascade de rendus réelle ici
    setLoading(true);
    setError('');

    api
      .get('/admin/interventions', { params: { statut: statut || undefined, priorite: priorite || undefined, page } })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setError('Unable to load interventions.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [statut, priorite, page]);

  function handleCreated(newIntervention) {
    setCreateOpen(false);
    showToast('Intervention created successfully.');
    setData((prev) => (prev ? { ...prev, data: [newIntervention, ...prev.data] } : prev));
  }

  function handleAssigned(updatedIntervention) {
    const wasReassign = assignTarget?.statut === 'assignee';
    setAssignTarget(null);
    showToast(wasReassign ? 'Intervention reassigned successfully.' : 'Intervention assigned successfully.');
    setData((prev) => ({
      ...prev,
      data: prev.data.map((i) => (i.id === updatedIntervention.id ? updatedIntervention : i)),
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Intervention Assignment</h1>
          <p className="text-sm text-[#707070]">Assign technicians and track all interventions.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#F80000] text-white hover:bg-[#C62221] transition-colors"
        >
          <Plus size={16} />
          New Intervention
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {ADMIN_STATUS_TABS.map((tab) => (
            <button
              key={tab.value || 'all'}
              onClick={() => { setStatut(tab.value); setPage(1); }}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors',
                statut === tab.value
                  ? 'bg-black text-white'
                  : 'bg-white text-[#707070] border border-[#e5e5e5] hover:text-black',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={priorite}
          onChange={(e) => { setPriorite(e.target.value); setPage(1); }}
          className="ml-auto rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#707070]"
        >
          <option value="">All Priorities</option>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#F80000]" />
        </div>
      )}

      {!loading && error && <p className="text-sm text-[#F80000]">{error}</p>}

      {!loading && !error && data && (
        <>
          {data.data.length === 0 ? (
            <p className="text-sm text-[#707070]">No interventions found.</p>
          ) : (
            <div className="space-y-4">
              {data.data.map((intervention) => {
                const assignable = ASSIGNABLE_STATUSES.includes(intervention.statut);
                const isReassign = intervention.statut === 'assignee';

                return (
                  <div key={intervention.id} className="rounded-xl border border-[#e5e5e5] bg-white p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_BADGE[intervention.priorite] || 'bg-[#F7F7F7] text-[#707070]'}`}>
                            {intervention.priorite}
                          </span>
                          <span className="text-xs text-[#707070]">{intervention.public_id}</span>
                        </div>
                        <h2 className="text-base font-bold text-black">{intervention.titre}</h2>
                        <p className="text-sm text-[#707070]">Client: {intervention.client?.name}</p>
                        <p className="text-sm text-[#707070]">
                          Technician: {intervention.technicien?.name || <span className="italic">Unassigned</span>}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_BADGE[intervention.statut] || ''}`}>
                          {STATUS_LABEL[intervention.statut] || intervention.statut}
                        </span>

                        {assignable ? (
                          <button
                            onClick={() => setAssignTarget(intervention)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e5e5e5] text-[#707070] hover:text-black hover:bg-[#F7F7F7] transition-colors"
                          >
                            <UserCheck size={13} />
                            {isReassign ? 'Reassign' : 'Assign'}
                          </button>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#707070]" title="Locked once in progress or completed">
                            <Lock size={13} />
                            Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {intervention.date_souhaitee && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-[#707070]">
                        <CalendarClock size={14} /> {intervention.date_souhaitee}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Pagination page={page} lastPage={data.last_page} onPageChange={setPage} />
        </>
      )}

      {createOpen && (
        <InterventionFormModal onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
      )}

      {assignTarget && (
        <AssignInterventionModal
          intervention={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}