import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../../services/api';
import{ STATUS_TABS , STATUS_BADGE} from '../../../constants/commercialStatus'
import { Link } from 'react-router-dom'; // ← ajouter à l'import existant
import Pagination from '../../../components/Pagination';

export default function Orders() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [rowError, setRowError] = useState({});

useEffect(() => {
  let cancelled = false;
  // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenche le chargement suite à un changement de statut/page, pas de cascade de rendus réelle ici
  setLoading(true);
  setError('');

  api
    .get('/commercial/orders', { params: { status: status || undefined, page } })
    .then((res) => { if (!cancelled) setData(res.data); })
    .catch(() => { if (!cancelled) setError('Unable to load orders.'); })
    .finally(() => { if (!cancelled) setLoading(false); });

  return () => { cancelled = true; };
}, [status, page]);

  async function handleValidate(order) {
    setUpdatingId(order.id);
    setRowError((prev) => ({ ...prev, [order.id]: '' }));

    try {
      const res = await api.put(
        `/commercial/orders/${encodeURIComponent(order.public_id)}`,
        { status: 'validee' }
      );
      setData((prev) => ({
        ...prev,
        data: prev.data.map((o) => (o.id === order.id ? res.data : o)),
      }));
    } catch (err) {
      const message =
        err.response?.status === 422
          ? err.response.data?.errors?.items?.[0] || 'Insufficient stock.'
          : 'Unable to validate this order.';
      setRowError((prev) => ({ ...prev, [order.id]: message }));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Orders</h1>
        <p className="text-sm text-[#707070]">Review and validate client orders.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); }}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors',
              status === tab.value
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
            <p className="text-sm text-[#707070]">No orders found.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#707070] border-b border-[#e5e5e5]">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((order) => (
                    <tr key={order.id} className="border-b border-[#e5e5e5] last:border-0">
                      <td className="px-4 py-3 font-semibold text-black">{order.public_id}</td>
                      <td className="px-4 py-3 text-[#707070]">{order.client?.name}</td>
                      <td className="px-4 py-3 text-black">${order.total}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[order.status] || ''}`}>
                          {order.status}
                        </span>
                      </td>
                     <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {order.status === 'en_attente' && (
                            <button
                              onClick={() => handleValidate(order)}
                              disabled={updatingId === order.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F80000] text-white hover:bg-[#C62221] disabled:opacity-50 transition-colors"
                            >
                              {updatingId === order.id ? 'Validating…' : 'Validate'}
                            </button>
                          )}
                          <Link
                            to={`/commercial/orders/${encodeURIComponent(order.public_id)}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e5e5e5] text-[#707070] hover:text-black hover:bg-[#F7F7F7] transition-colors"
                          >
                            View
                          </Link>
                        </div>
                        {rowError[order.id] && (
                          <p className="mt-1 text-xs text-[#F80000]">{rowError[order.id]}</p>
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