import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, PackageSearch } from 'lucide-react';
import api from '../../../services/api';
import { ORDER_STATUS } from '../../../constants/orderStatus';
import { formatDate } from '../../../lib/formatDate';
import { formatPrice } from '../../../lib/formatPrice';
import Pagination from '../../../components/Pagination';


export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState(false);

  useEffect(() => {
  api.get('/client/orders', { params: { page } })
    .then((res) => {
      const payload = res.data;
      setOrders(payload.data ?? payload ?? []);
      setLastPage(payload.last_page ?? 1);
    })
    .catch(() => setError(true));
}, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Sora'] text-3xl font-bold text-black md:text-4xl">
          My Orders
        </h1>
        <p className="mt-2 max-w-xl text-[#707070]">
          Review your order history and track deliveries.
        </p>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 shadow-sm">
        {error && (
          <p className="text-sm text-[#C62221]">
            Couldn't load your orders. Please try again later.
          </p>
        )}

        {!error && orders === null && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-[#F7F7F7]" />
            ))}
          </div>
        )}

        {!error && orders !== null && orders.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-[#707070]">
            <PackageSearch size={28} />
            <p>You haven't placed any orders yet.</p>
            <Link
              to="/products"
              className="text-sm font-semibold text-[#F80000] hover:underline"
            >
              Browse the catalog
            </Link>
          </div>
        )}

        {!error && orders !== null && orders.length > 0 && (
          <>
            <div className="space-y-3">
              {orders.map((order) => {
                const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.en_attente;
                return (
                  <Link
                    to={`/client/orders/${encodeURIComponent(order.public_id)}`}
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-[#e5e5e5] p-4 transition-colors hover:bg-[#F7F7F7]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded bg-[#F7F7F7]">
                        <Boxes size={20} className="text-black" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-black">
                          Order {order.public_id}
                        </p>
                        <p className="text-xs text-[#707070]">
                          {order.items?.length
                            ? `${order.items.length} item(s)`
                            : 'View details'}{' '}
                          · {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}
                      >
                        {status.label}
                      </span>
                      <p className="mt-1 text-sm font-semibold text-black">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </Link>
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