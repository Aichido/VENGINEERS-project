import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { muCurrency } from '../../../constants/adminStats';
import { stockStatus } from '../../../constants/productStock';
import { useToast } from '../../../context/ToastContext';

export default function Products() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let cancelled = false;
      setLoading(true);
      setError('');

      api
        .get('/admin/products', { params: { category: category || undefined, search: search || undefined, page } })
        .then((res) => { if (!cancelled) setData(res.data); })
        .catch(() => { if (!cancelled) setError('Unable to load products.'); })
        .finally(() => { if (!cancelled) setLoading(false); });

      return () => { cancelled = true; };
    }, search ? 400 : 0);

    return () => clearTimeout(timeout);
  }, [category, search, page]);

  function openEdit(product) {
    navigate(`/admin/products/${product.id}/edit`, { state: { product } });
  }

  async function confirmDelete() {
    const product = deleteTarget;
    if (!product) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/products/${product.id}`);
      setData((prev) => ({ ...prev, data: prev.data.filter((p) => p.id !== product.id) }));
      setDeleteTarget(null);
      showToast('Product deleted successfully.');
    } catch {
      setError('Unable to delete this product.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Product Catalog</h1>
          <p className="text-sm text-[#707070]">Manage products, pricing, stock and images.</p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#F80000] text-white hover:bg-[#C62221] transition-colors"
        >
          <Plus size={16} />
          New Product
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#707070]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="relative ml-auto w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707070]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name…"
            className="w-full rounded-lg border border-[#e5e5e5] pl-9 pr-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#F80000]" />
        </div>
      )}

      {!loading && error && <p className="text-sm text-[#F80000]">{error}</p>}

      {!loading && !error && data && (
        <>
          <p className="text-xs text-[#707070]">Showing {data.data.length} of {data.total} products</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.data.map((product) => {
              const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
              const stock = stockStatus(product.stock_qty);

              return (
                <div key={product.id} className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden flex flex-col">
                  <div className="relative h-40 bg-[#F7F7F7]">
                    {primaryImage ? (
                      <img src={primaryImage.thumbnail_url || primaryImage.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#707070]">
                        <Package size={28} />
                      </div>
                    )}
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${stock.tone}`}>
                      {stock.label}
                    </span>
                    {!product.is_active && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#404040] text-white">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-black leading-snug">{product.name}</h3>
                      <span className="text-sm font-bold text-[#F80000] whitespace-nowrap">{muCurrency.format(product.price)}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#707070]">{product.category?.name}</p>
                    {product.description && (
                      <p className="mt-2 text-xs text-[#707070] line-clamp-2 flex-1">{product.description}</p>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e5e5e5] text-[#707070] hover:text-black hover:bg-[#F7F7F7] transition-colors"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        title="Delete"
                        className="p-2 rounded-lg text-[#F80000] hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <Link
              to="/admin/products/new"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e5e5e5] text-[#707070] hover:text-[#F80000] hover:border-[#F80000] transition-colors min-h-[280px]"
            >
              <Plus size={24} />
              <span className="text-sm font-semibold">Add New Product</span>
            </Link>
          </div>

          <Pagination page={page} lastPage={data.last_page} onPageChange={setPage} />
        </>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete product"
          message={`Delete "${deleteTarget.name}"? This also removes its images and cannot be undone.`}
          confirmLabel="Delete"
          submitting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}