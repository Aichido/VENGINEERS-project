import { useEffect, useState } from 'react';
import { Loader2, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';
import { useToast } from '../../../context/ToastContext';
import { STATUS_BADGE, STATUS_LABEL } from '../../../constants/interventionStatus';
import { ADMIN_STATUS_TABS } from '../../../constants/adminInterventions';

export default function Reports() {
  const { showToast } = useToast();

  const [statut, setStatut] = useState('terminee');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [reportsByIntervention, setReportsByIntervention] = useState({});
  const [reportsLoading, setReportsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenche le chargement suite à un changement de statut/page, pas de cascade de rendus réelle ici
    setLoading(true);
    setError('');

    api
      .get('/admin/interventions', { params: { statut: statut || undefined, page } })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setError('Unable to load interventions.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [statut, page]);

  async function toggleExpand(intervention) {
    if (expandedId === intervention.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(intervention.id);

    if (reportsByIntervention[intervention.id]) return;

    setReportsLoading(true);
    try {
      const res = await api.get(`/admin/interventions/${encodeURIComponent(intervention.public_id)}/reports`);
      setReportsByIntervention((prev) => ({ ...prev, [intervention.id]: res.data }));
    } catch {
      showToast('Unable to load reports for this intervention.', 'error');
    } finally {
      setReportsLoading(false);
    }
  }

  async function handleDownload(intervention, report) {
    setDownloadingId(report.id);
    try {
      const res = await api.get(
        `/interventions/${encodeURIComponent(intervention.public_id)}/reports/${report.id}/download`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = report.fichier_path?.split('/').pop() || `report-${report.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('Unable to download this report.', 'error');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Intervention Reports</h1>
        <p className="text-sm text-[#707070]">Browse and download technician reports.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ADMIN_STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            onClick={() => { setStatut(tab.value); setPage(1); setExpandedId(null); }}
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
            <div className="space-y-3">
              {data.data.map((intervention) => {
                const isExpanded = expandedId === intervention.id;
                const reports = reportsByIntervention[intervention.id];

                return (
                  <div key={intervention.id} className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
                    <button
                      onClick={() => toggleExpand(intervention)}
                      className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-[#F7F7F7]/60 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-[#707070]">{intervention.public_id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[intervention.statut] || ''}`}>
                            {STATUS_LABEL[intervention.statut] || intervention.statut}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-black">{intervention.titre}</h2>
                        <p className="text-sm text-[#707070]">
                          Client: {intervention.client?.name} · Technician: {intervention.technicien?.name || '—'}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp size={18} className="text-[#707070] shrink-0" /> : <ChevronDown size={18} className="text-[#707070] shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[#e5e5e5] p-5 bg-[#F7F7F7]">
                        {reportsLoading && !reports ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-[#F80000]" />
                          </div>
                        ) : reports && reports.length > 0 ? (
                          <ul className="space-y-2">
                            {reports.map((report) => (
                              <li key={report.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e5e5e5] bg-white px-4 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <FileText size={16} className="text-[#707070] shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-black truncate">
                                      Report by {report.technicien?.name || 'Unknown technician'}
                                    </p>
                                    <p className="text-xs text-[#707070]">
                                      {new Date(report.created_at).toLocaleString()}
                                    </p>
                                    {report.contenu && (
                                      <p className="mt-1 text-xs text-[#707070] line-clamp-2">{report.contenu}</p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDownload(intervention, report)}
                                  disabled={downloadingId === report.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F80000] text-white hover:bg-[#C62221] disabled:opacity-50 transition-colors shrink-0"
                                >
                                  {downloadingId === report.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                                  Download
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-[#707070]">No reports uploaded for this intervention yet.</p>
                        )}
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
    </div>
  );
}