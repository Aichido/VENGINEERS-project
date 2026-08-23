import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';
import { LOG_TYPE_TABS, LOG_TYPE_LABEL, LOG_TYPE_BADGE } from '../../../constants/adminLogs';

function formatTimestamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminLogs() {
  const [type, setType] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce des champs texte/nombre pour ne pas requêter à chaque frappe
  useEffect(() => {
    const timeout = setTimeout(() => {
      setUserId(userIdInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [userIdInput]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAction(actionInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [actionInput]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenche le chargement suite à un changement de filtre/page, pas de cascade de rendus réelle ici
    setLoading(true);
    setError('');

    api
      .get('/admin/logs', {
        params: {
          type: type || undefined,
          user_id: userId || undefined,
          action: action || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page,
        },
      })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setError('Unable to load logs.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [type, userId, action, dateFrom, dateTo, page]);

  function resetFilters() {
    setType('');
    setUserIdInput('');
    setActionInput('');
    setUserId('');
    setAction('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  const hasActiveFilters = type || userId || action || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">System Logs</h1>
        <p className="text-sm text-[#707070]">
          Full activity trail across accounts, orders, and interventions.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {LOG_TYPE_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            onClick={() => { setType(tab.value); setPage(1); }}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors',
              type === tab.value
                ? 'bg-black text-white'
                : 'bg-white text-[#707070] border border-[#e5e5e5] hover:text-black',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#e5e5e5] bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="log-filter-user" className="text-xs font-semibold uppercase tracking-wide text-[#707070]">
            User ID
          </label>
          <input
            id="log-filter-user"
            type="number"
            min="1"
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            placeholder="e.g. 12"
            className="w-28 rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-sm text-black"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="log-filter-action" className="text-xs font-semibold uppercase tracking-wide text-[#707070]">
            Action
          </label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#707070]" />
            <input
              id="log-filter-action"
              type="text"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              placeholder="e.g. product_created"
              className="w-52 rounded-lg border border-[#e5e5e5] pl-8 pr-3 py-1.5 text-sm text-black"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="log-filter-from" className="text-xs font-semibold uppercase tracking-wide text-[#707070]">
            From
          </label>
          <input
            id="log-filter-from"
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-sm text-black"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="log-filter-to" className="text-xs font-semibold uppercase tracking-wide text-[#707070]">
            To
          </label>
          <input
            id="log-filter-to"
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-sm text-black"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="ml-auto text-sm font-semibold text-[#707070] hover:text-black transition-colors"
          >
            Reset filters
          </button>
        )}
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
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-8 text-center">
              <p className="text-sm text-[#707070]">
                {hasActiveFilters
                  ? 'No log entries match these filters.'
                  : 'No log entries yet.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-2 text-sm font-semibold text-[#F80000] hover:text-[#C62221] transition-colors"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {data.data.map((entry, index) => (
                <div
                  key={`${entry.type}-${entry.timestamp}-${index}`}
                  className="flex items-start gap-4 rounded-xl border border-[#e5e5e5] bg-white p-4"
                >
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${LOG_TYPE_BADGE[entry.type] || 'bg-[#F7F7F7] text-[#707070]'}`}
                  >
                    {LOG_TYPE_LABEL[entry.type] || entry.type}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-black break-words">{entry.summary}</p>
                    <p className="mt-1 text-xs text-[#707070]">
                      {entry.user_id ? `User #${entry.user_id}` : 'System'} · {formatTimestamp(entry.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination page={page} lastPage={data.meta.last_page} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}