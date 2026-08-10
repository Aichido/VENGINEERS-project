import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShoppingBag, PackageSearch, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import{ STATUS_LABELS} from '../../../constants/commercialStatus'

export default function CommercialDashboard() {
  const [orders, setOrders] = useState(null);
  const [stock, setStock] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [ordersRes, stockRes] = await Promise.all([
          api.get('/commercial/orders', { params: { status: 'en_attente' } }),
          api.get('/commercial/stock'),
        ]);
        if (!cancelled) {
          setOrders(ordersRes.data);
          setStock(stockRes.data);
        }
      } catch {
        if (!cancelled) setError('Unable to load dashboard data.');
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return <p className="text-sm text-[#F80000]">{error}</p>;
  }

  if (!orders || !stock) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#F80000]" />
      </div>
    );
  }

  const lowStockProducts = stock.data.filter((p) => p.stock_qty <= 5).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black">Overview</h1>
        <p className="text-sm text-[#707070]">Commercial dashboard summary.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <div className="flex items-center gap-2 text-[#707070] text-xs font-semibold uppercase tracking-wide">
            <ShoppingBag size={16} />
            Pending Orders
          </div>
          <div className="mt-2 text-3xl font-bold text-black">{orders.total}</div>
        </div>
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <div className="flex items-center gap-2 text-[#707070] text-xs font-semibold uppercase tracking-wide">
            <PackageSearch size={16} />
            Products Tracked
          </div>
          <div className="mt-2 text-3xl font-bold text-black">{stock.total}</div>
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-black">
            <AlertTriangle size={16} className="text-[#ECB115]" />
            Lowest Stock
          </h2>
          <Link to="/commercial/stock" className="text-xs font-semibold text-[#F80000] hover:underline">
            View all
          </Link>
        </div>
        {lowStockProducts.length === 0 ? (
          <p className="text-sm text-[#707070]">No products currently low on stock.</p>
        ) : (
          <ul className="divide-y divide-[#e5e5e5]">
            {lowStockProducts.map((product) => (
              <li key={product.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-black">{product.name}</span>
                <span className="font-semibold text-[#F80000]">{product.stock_qty} left</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black">Orders awaiting validation</h2>
          <Link to="/commercial/orders" className="text-xs font-semibold text-[#F80000] hover:underline">
            View all
          </Link>
        </div>
        {orders.data.length === 0 ? (
          <p className="text-sm text-[#707070]">No pending orders.</p>
        ) : (
          <ul className="divide-y divide-[#e5e5e5]">
            {orders.data.slice(0, 5).map((order) => (
              <li key={order.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-semibold text-black">{order.public_id}</div>
                  <div className="text-[#707070]">{order.client?.name}</div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#707070]">
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}