import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ClipboardList, Wrench, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import { STATUS_BADGE, STATUS_LABEL } from '../../../constants/interventionStatus';

async function fetchCount(statut) {
  const res = await api.get('/technicien/interventions', { params: { statut, per_page: 1 } });
  return res.data.total ?? 0;
}

export default function TechnicienDashboard() {
  const [counts, setCounts] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- charge une fois au montage, pas de cascade de rendus réelle ici
    setLoading(true);
    setError('');

    Promise.all([
      fetchCount('assignee'),
      fetchCount('en_cours'),
      fetchCount('terminee'),
      api.get('/technicien/interventions', { params: { statut: 'en_cours', per_page: 5 } }),
    ])
      .then(([assignee, enCours, terminee, queueRes]) => {
        if (cancelled) return;
        setCounts({ assignee, en_cours: enCours, terminee });
        setQueue(queueRes.data.data);
      })
      .catch(() => { if (!cancelled) setError('Unable to load your dashboard.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

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

  const statCards = [
    { label: 'Assigned', value: counts.assignee, icon: ClipboardList },
    { label: 'In progress', value: counts.en_cours, icon: Wrench },
    { label: 'Completed', value: counts.terminee, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Overview</h1>
        <p className="text-sm text-[#707070]">Technicien dashboard summary.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-[#e5e5e5] bg-white p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F80000]/10 text-[#F80000]">
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#707070]">{label}</p>
              <p className="text-2xl font-bold text-black">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black">In-progress interventions</h2>
          <Link to="/technicien/interventions" className="text-xs font-semibold text-[#F80000] hover:underline">
            View all
          </Link>
        </div>

        {queue.length === 0 ? (
          <p className="text-sm text-[#707070]">No intervention currently in progress.</p>
        ) : (
          <ul className="divide-y divide-[#e5e5e5]">
            {queue.map((intervention) => (
              <li key={intervention.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-black">{intervention.titre}</p>
                  <p className="text-xs text-[#707070]">
                    {intervention.public_id} · {intervention.client?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[intervention.statut] || ''}`}>
                    {STATUS_LABEL[intervention.statut] || intervention.statut}
                  </span>
                  <Link
                    to={`/technicien/interventions/${encodeURIComponent(intervention.public_id)}`}
                    className="text-xs font-semibold text-[#F80000] hover:underline"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
