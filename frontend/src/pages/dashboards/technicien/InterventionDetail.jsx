import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import api from '../../../services/api';
import { STATUS_BADGE, STATUS_LABEL, PRIORITY_BADGE } from '../../../constants/interventionStatus';
import ReportUploadForm from '../../../components/ReportUploadForm';

// Actions disponibles selon le statut courant, cohérent avec
// Technicien\InterventionController::ALLOWED_TRANSITIONS côté backend
// (assignee→en_cours, en_cours→terminee — bloqué tant qu'aucun rapport
// n'existe, le serveur renvoie alors un 422 affiché dans actionError).
const ACTIONS_BY_STATUS = {
  nouvelle: [],
  assignee: [
    { to: 'en_cours', label: 'Start intervention', style: 'bg-[#F80000] hover:bg-[#C62221] text-white' },
  ],
  en_cours: [
    { to: 'terminee', label: 'Mark as completed', style: 'bg-black hover:bg-[#404040] text-white' },
  ],
  terminee: [],
};

export default function InterventionDetail() {
  const { publicId } = useParams();
  const [intervention, setIntervention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchIntervention = useCallback(() => {
    setLoading(true);
    setError('');

    return api
      .get(`/technicien/interventions/${encodeURIComponent(publicId)}`)
      .then((res) => setIntervention(res.data))
      .catch((err) => {
        setError(err.response?.status === 404 ? 'Intervention not found.' : 'Unable to load this intervention.');
      })
      .finally(() => setLoading(false));
  }, [publicId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenche le chargement suite à un changement de publicId, pas de cascade de rendus réelle ici
    fetchIntervention();
  }, [fetchIntervention]);

  async function handleAction(newStatus) {
    setActionLoading(true);
    setActionError('');

    try {
      const res = await api.put(`/technicien/interventions/${encodeURIComponent(publicId)}`, {
        statut: newStatus,
      });
      setIntervention(res.data);
    } catch (err) {
      const message =
        err.response?.status === 422
          ? err.response.data?.errors?.statut?.[0] || err.response.data?.message || 'This action could not be completed.'
          : 'This action could not be completed.';
      setActionError(message);
    } finally {
      setActionLoading(false);
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
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#F80000]">{error}</p>
        <Link to="/technicien/interventions" className="text-sm font-semibold text-[#F80000] hover:underline">
          ← Back to interventions
        </Link>
      </div>
    );
  }

  const actions = ACTIONS_BY_STATUS[intervention.statut] || [];
  const reports = intervention.reports || [];

  return (
    <div className="space-y-6">
      <Link
        to="/technicien/interventions"
        className="inline-flex items-center gap-1 text-sm text-[#707070] hover:text-black"
      >
        <ArrowLeft size={16} /> Back to interventions
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">{intervention.titre}</h1>
          <p className="text-sm text-[#707070]">
            {intervention.public_id} · Client: {intervention.client?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {intervention.priorite && (
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                PRIORITY_BADGE[intervention.priorite] || 'bg-[#F7F7F7] text-[#707070]'
              }`}
            >
              {intervention.priorite}
            </span>
          )}
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_BADGE[intervention.statut] || ''}`}>
            {STATUS_LABEL[intervention.statut] || intervention.statut}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 space-y-4">
        <h2 className="text-sm font-bold text-black">Job summary</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#707070]">Equipment</dt>
            <dd className="text-black">{intervention.equipement || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#707070]">Requested date</dt>
            <dd className="text-black">{intervention.date_souhaitee || '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#707070]">Description</dt>
            <dd className="text-black">{intervention.description || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#707070]">Client contact</dt>
            <dd className="text-black">{intervention.client?.email || '—'}</dd>
          </div>
        </dl>
      </div>

      {actions.length > 0 && (
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <h2 className="text-sm font-bold text-black mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <button
                key={action.to}
                onClick={() => handleAction(action.to)}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${action.style}`}
              >
                {actionLoading ? 'Processing…' : action.label}
              </button>
            ))}
          </div>
          {actionError && <p className="mt-3 text-sm text-[#F80000]">{actionError}</p>}
        </div>
      )}

      {intervention.statut === 'en_cours' && (
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <h2 className="text-sm font-bold text-black mb-4">Submit intervention report</h2>
          <p className="text-xs text-[#707070] mb-4">
            A report with an attached file is required before this intervention can be marked as completed.
          </p>
          <ReportUploadForm interventionPublicId={intervention.public_id} onSuccess={() => fetchIntervention()} />
        </div>
      )}

      {reports.length > 0 && (
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <h2 className="text-sm font-bold text-black mb-4">Submitted reports</h2>
          <ul className="space-y-3">
            {reports.map((report) => (
              <li key={report.id} className="flex items-start gap-3 border-b border-[#e5e5e5] last:border-0 pb-3 last:pb-0">
                <FileText size={18} className="text-[#707070] mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-black">{report.contenu}</p>
                  <p className="text-xs text-[#707070]">{new Date(report.created_at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
