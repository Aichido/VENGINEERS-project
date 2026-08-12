import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Wrench, CalendarClock } from 'lucide-react';
import api from '../../../services/api';
import { STATUS_TABS, STATUS_BADGE, STATUS_LABEL, PRIORITY_BADGE } from '../../../constants/interventionStatus';
import Pagination from '../../../components/Pagination';

export default function Interventions() {
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  console.log(data)

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenche le chargement suite à un changement de statut/page, pas de cascade de rendus réelle ici
    setLoading(true);
    setError('');

    api
      .get('/technicien/interventions', { params: { statut: statut || undefined, page } })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setError('Unable to load interventions.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [statut, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">My interventions</h1>
        <p className="text-sm text-[#707070]">Your assigned interventions and their current status.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
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
              {data.data.map((intervention) => (
                <Link
                  key={intervention.id}
                  to={`/technicien/interventions/${encodeURIComponent(intervention.public_id)}`}
                  className="block rounded-xl border border-[#e5e5e5] bg-white p-5 hover:border-[#F80000]/40 transition-colors"
                >
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {intervention.priorite && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                              PRIORITY_BADGE[intervention.priorite] || 'bg-[#F7F7F7] text-[#707070]'
                            }`}
                          >
                            {intervention.priorite}
                          </span>
                        )}
                        <span className="text-xs text-[#707070]">{intervention.public_id}</span>
                      </div>
                      <h2 className="text-base font-bold text-black">{intervention.titre}</h2>
                      <p className="text-sm text-[#707070]">Client: {intervention.client?.name}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_BADGE[intervention.statut] || ''}`}>
                      {STATUS_LABEL[intervention.statut] || intervention.statut}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#707070]">
                    {intervention.equipement && (
                      <span className="flex items-center gap-1">
                        <Wrench size={14} /> {intervention.equipement}
                      </span>
                    )}
                    {intervention.date_souhaitee && (
                      <span className="flex items-center gap-1">
                        <CalendarClock size={14} /> {intervention.date_souhaitee}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Pagination page={page} lastPage={data.last_page} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
