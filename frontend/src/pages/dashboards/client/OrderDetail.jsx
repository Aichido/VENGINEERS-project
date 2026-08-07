import { useEffect, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Boxes, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import { ORDER_STATUS } from '../../../constants/orderStatus';
import { formatDate } from '../../../lib/formatDate';
import { formatPrice } from '../../../lib/formatPrice';

export default function OrderDetail() {
  const { publicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(false);
  const [successMsg] = useState(location.state?.success ?? '');

  useEffect(() => {
    if (location.state?.success) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  api.get(`/client/orders/${encodeURIComponent(publicId)}`)
    .then((res) => setOrder(res.data))
    .catch((err) => {
      if (err.response?.status === 404) setNotFound(true);
      else if (err.response?.status === 403) setForbidden(true);
      else setError(true);
    });
}, [publicId]);

  if (forbidden) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AlertCircle size={32} className="text-[#707070]" />
        <p className="text-[#707070]">This order doesn't belong to you.</p>
        <Link
          to="/client/orders"
          className="text-sm font-semibold text-[#F80000] hover:underline"
        >
          Back to my orders
        </Link>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AlertCircle size={32} className="text-[#707070]" />
        <p className="text-[#707070]">Order not found.</p>
        <Link
          to="/client/orders"
          className="text-sm font-semibold text-[#F80000] hover:underline"
        >
          Back to my orders
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AlertCircle size={32} className="text-[#C62221]" />
        <p className="text-[#C62221]">
          Something went wrong loading this order. Please try again later.
        </p>
        <Link
          to="/client/orders"
          className="text-sm font-semibold text-[#F80000] hover:underline"
        >
          Back to my orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[#F7F7F7]" />
        <div className="h-40 animate-pulse rounded-xl bg-[#F7F7F7]" />
      </div>
    );
  }

  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.en_attente;

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMsg}
        </div>
      )}
      <div>
        <Link
          to="/client/orders"
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[#707070] hover:text-black"
        >
          <ChevronLeft size={16} />
          Back to my orders
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-['Sora'] text-2xl font-bold text-black md:text-3xl">
              Order {order.public_id}
            </h1>
            <p className="mt-1 text-sm text-[#707070]">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <span className={`w-fit rounded-full px-4 py-1.5 text-sm font-bold ${status.tone}`}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-['Sora'] text-lg font-bold text-black">Items</h2>
        <div className="divide-y divide-[#e5e5e5]">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-[#F7F7F7]">
                  <Boxes size={20} className="text-black" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">
                    {item.product?.name ?? `Product #${item.product_id}`}
                  </p>
                  <p className="text-xs text-[#707070]">
                    {item.qty} × {formatPrice(item.unit_price)}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-black">
                {formatPrice(item.qty * item.unit_price)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#e5e5e5] pt-4">
          <p className="font-['Sora'] text-lg font-bold text-black">Total</p>
          <p className="font-['Sora'] text-lg font-bold text-black">
            {formatPrice(order.total)}
          </p>
        </div>
      </div>
    </div>
  );
}