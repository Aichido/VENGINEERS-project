import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wrench, Plus } from 'lucide-react';
import api from '../../../services/api';
import { INTERVENTION_STATUS  as STATUS } from '../../../constants/interventionStatus';
import { formatDate } from '../../../lib/formatDate';
import Pagination from '../../../components/Pagination';

export default function Interventions() {
  const location = useLocation();
  const navigate = useNavigate();

  const [history, setHistory] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [historyError, setHistoryError] = useState(false);
  const [successMsg] = useState(location.state?.success ?? '');

  useEffect(() => {
    // Clear the router state so the banner doesn't reappear on a refresh
    // or when navigating back to this page later.
    if (location.state?.success) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  api.get('/client/interventions', { params: { page } })
    .then((res) => {
      const payload = res.data;
      setHistory(payload.data ?? payload ?? []);
      setLastPage(payload.last_page ?? 1);
    })
    .catch(() => setHistoryError(true));
}, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-['Sora'] text-3xl font-bold text-black md:text-4xl">
            Interventions
          </h1>
          <p className="mt-2 max-w-xl text-[#707070]">
            Track the status of your intervention requests.
          </p>
        </div>
        <Link
          to="/client/interventions/new"
          className="flex items-center gap-2 rounded-xl bg-[#F80000] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus size={18} />
          New Request
        </Link>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 shadow-sm">
        {historyError && (
          <p className="text-sm text-[#C62221]">
            Couldn't load your intervention history. Please try again later.
          </p>
        )}

        {!historyError && history === null && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-[#F7F7F7]" />
            ))}
          </div>
        )}

        {!historyError && history !== null && history.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-[#707070]">
            <Wrench size={28} />
            <p>No intervention requests yet.</p>
            <Link
              to="/client/interventions/new"
              className="text-sm font-semibold text-[#F80000] hover:underline"
            >
              Submit your first request
            </Link>
          </div>
        )}

        {!historyError && history !== null && history.length > 0 && (
          <>
            <div className="space-y-3">
              {history.map((item) => {
                const status = STATUS[item.statut] ?? STATUS.nouvelle;
                const StatusIcon = status.icon;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-[#e5e5e5] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F7F7F7]">
                        <StatusIcon size={16} className="text-black" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-black">
                          {item.titre}
                        </p>
                        {item.public_id && (
                          <p className="text-[11px] font-mono text-[#707070]">
                            {item.public_id}
                          </p>
                        )}
                        {item.equipement && (
                          <p className="text-xs text-[#707070]">{item.equipement}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}
                      >
                        {status.label}
                      </span>
                      <p className="text-xs text-[#707070]">
                        {formatDate(item.date_souhaitee)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {lastPage > 1 && (
              <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}