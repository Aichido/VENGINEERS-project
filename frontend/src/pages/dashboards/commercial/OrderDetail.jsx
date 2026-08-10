import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import api from '../../../services/api';
import{ STATUS_BADGE} from '../../../constants/commercialStatus'



// Actions disponibles selon le statut courant, cohérent avec
// CommercialOrderController::ALLOWED_TRANSITIONS côté backend.
const ACTIONS_BY_STATUS = {
  en_attente: [
    { to: 'validee', label: 'Validate', style: 'bg-[#F80000] hover:bg-[#C62221] text-white' },
    { to: 'annulee', label: 'Cancel', style: 'border border-[#e5e5e5] text-[#707070] hover:text-black' },
  ],
  validee: [
    { to: 'expediee', label: 'Mark as Shipped', style: 'bg-black hover:bg-[#404040] text-white' },
    { to: 'annulee', label: 'Cancel', style: 'border border-[#e5e5e5] text-[#707070] hover:text-black' },
  ],
  expediee: [
    { to: 'livree', label: 'Mark as Delivered', style: 'bg-black hover:bg-[#404040] text-white' },
  ],
  livree: [],
  annulee: [],
};

export default function OrderDetail() {
  const { publicId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchOrder = useCallback(() => {
    setLoading(true);
    setError('');

    return api
      .get(`/commercial/orders/${encodeURIComponent(publicId)}`)
      .then((res) => setOrder(res.data))
      .catch((err) => {
        setError(err.response?.status === 404 ? 'Order not found.' : 'Unable to load this order.');
      })
      .finally(() => setLoading(false));
  }, [publicId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenche le chargement suite à un changement de publicId, pas de cascade de rendus réelle ici
    fetchOrder();
  }, [fetchOrder]);

  async function handleAction(newStatus) {
    setActionLoading(true);
    setActionError('');

    try {
      const res = await api.put(`/commercial/orders/${encodeURIComponent(publicId)}`, {
        status: newStatus,
      });
      setOrder(res.data);
    } catch (err) {
      const message =
        err.response?.status === 422
          ? err.response.data?.errors?.items?.[0]
            || err.response.data?.errors?.status?.[0]
            || 'This action could not be completed.'
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
        <Link to="/commercial/orders" className="text-sm font-semibold text-[#F80000] hover:underline">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const actions = ACTIONS_BY_STATUS[order.status] || [];

  return (
    <div className="space-y-6">
      <Link
        to="/commercial/orders"
        className="inline-flex items-center gap-1 text-sm text-[#707070] hover:text-black"
      >
        <ArrowLeft size={16} /> Back to orders
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">{order.public_id}</h1>
          <p className="text-sm text-[#707070]">
            Placed by {order.client?.name} ({order.client?.email})
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_BADGE[order.status] || ''}`}>
          {order.status}
        </span>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <h2 className="text-sm font-bold text-black mb-4">Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#707070] border-b border-[#e5e5e5]">
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">Unit price</th>
                <th className="py-2">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-[#e5e5e5] last:border-0">
                  <td className="py-2 pr-4 text-black">{item.product?.name}</td>
                  <td className="py-2 pr-4 text-[#707070]">{item.qty}</td>
                  <td className="py-2 pr-4 text-[#707070]">${item.unit_price}</td>
                  <td className="py-2 text-black font-semibold">
                    ${(item.qty * item.unit_price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end text-sm">
          <span className="text-[#707070] mr-2">Total:</span>
          <span className="font-bold text-black">${order.total}</span>
        </div>
      </div>

      {order.commercial && (
        <p className="text-xs text-[#707070]">
          Handled by {order.commercial.name}
        </p>
      )}

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
    </div>
  );
}