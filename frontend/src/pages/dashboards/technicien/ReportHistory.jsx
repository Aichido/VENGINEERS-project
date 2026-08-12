import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, FileText } from 'lucide-react';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';

export default function ReportHistory() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenche le chargement suite à un changement de page, pas de cascade de rendus réelle ici
    setLoading(true);
    setError('');

    api
      .get('/technicien/reports', { params: { page } })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setError('Unable to load your report history.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Report history</h1>
        <p className="text-sm text-[#707070]">All the intervention reports you've submitted.</p>
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
            <p className="text-sm text-[#707070]">No report submitted yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#707070] border-b border-[#e5e5e5]">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Intervention</th>
                    <th className="px-4 py-3">Findings</th>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((report) => (
                    <tr key={report.id} className="border-b border-[#e5e5e5] last:border-0">
                      <td className="px-4 py-3 text-[#707070] whitespace-nowrap">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-black">
                        {report.intervention?.titre || report.intervention?.public_id}
                      </td>
                      <td className="px-4 py-3 text-[#707070] max-w-xs truncate">{report.contenu}</td>
                      <td className="px-4 py-3">
                        {report.fichier_path ? (
                          <span className="inline-flex items-center gap-1 text-[#707070]">
                            <FileText size={14} /> Attached
                          </span>
                        ) : (
                          <span className="text-[#707070]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {report.intervention?.public_id && (
                          <Link
                            to={`/technicien/interventions/${encodeURIComponent(report.intervention.public_id)}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e5e5e5] text-[#707070] hover:text-black hover:bg-[#F7F7F7] transition-colors"
                          >
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={page} lastPage={data.last_page} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
