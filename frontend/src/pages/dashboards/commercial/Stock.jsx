import { useEffect, useState } from 'react';
import { Loader2, BellRing, Check } from 'lucide-react';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';

export default function Stock() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifyingId, setNotifyingId] = useState(null);
  const [notifiedIds, setNotifiedIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenche le chargement suite à un changement de page, pas de cascade de rendus réelle ici
    setLoading(true);
    setError('');

    api
      .get('/commercial/stock', { params: { page } })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setError('Unable to load stock.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page]);

  async function handleNotify(productId) {
    setNotifyingId(productId);
    try {
      await api.post(`/commercial/stock/${productId}/notify-low-stock`);
      setNotifiedIds((prev) => new Set(prev).add(productId));
    } catch {
      // silencieux : l'utilisateur peut simplement réessayer
    } finally {
      setNotifyingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Stock</h1>
        <p className="text-sm text-[#707070]">Real-time inventory, sorted by lowest stock first.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#F80000]" />
        </div>
      )}

      {!loading && error && <p className="text-sm text-[#F80000]">{error}</p>}

      {!loading && !error && data && (
        <>
          <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#707070] border-b border-[#e5e5e5]">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((product) => {
                  const isLow = product.stock_qty <= 5;
                  const notified = notifiedIds.has(product.id);

                  return (
                    <tr key={product.id} className="border-b border-[#e5e5e5] last:border-0">
                      <td className="px-4 py-3 font-semibold text-black">{product.name}</td>
                      <td className="px-4 py-3 text-[#707070]">${product.price}</td>
                      <td className={`px-4 py-3 font-semibold ${isLow ? 'text-[#F80000]' : 'text-black'}`}>
                        {product.stock_qty}
                      </td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-[#F80000]">
                            Low stock
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isLow && (
                          <button
                            onClick={() => handleNotify(product.id)}
                            disabled={notifyingId === product.id || notified}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black text-white hover:bg-[#404040] disabled:opacity-50 transition-colors"
                          >
                            {notified ? (
                              <>
                                <Check size={14} /> Notified
                              </>
                            ) : (
                              <>
                                <BellRing size={14} />
                                {notifyingId === product.id ? 'Notifying…' : 'Notify Admin'}
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

         <Pagination page={page} lastPage={data.last_page} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}