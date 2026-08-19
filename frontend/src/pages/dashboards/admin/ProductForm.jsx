import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import ImageUploadGallery from '../../../components/admin/ImageUploadGallery';
import { useToast } from '../../../context/ToastContext';

export default function ProductForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [product, setProduct] = useState(location.state?.product || null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', description: '', price: '', stock_qty: '', category_id: '', is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (product) {
       // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise le formulaire avec le produit chargé, pas de cascade de rendus réelle ici
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price ?? '',
        stock_qty: product.stock_qty ?? '',
        category_id: product.category_id ?? product.category?.id ?? '',
        is_active: product.is_active ?? true,
      });
    }
  }, [product]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError('');

    const payload = {
      name: form.name,
      description: form.description || null,
      price: form.price,
      stock_qty: form.stock_qty,
      category_id: form.category_id,
      is_active: form.is_active,
    };

    try {
      if (isEdit && product) {
        const res = await api.put(`/admin/products/${product.id}`, payload);
        setProduct(res.data);
        showToast('Product updated successfully.');
      } else {
        const res = await api.post('/admin/products', payload);
        setProduct(res.data);
        showToast('Product created successfully.');
        // Bascule en mode édition sans recharger — les images ne peuvent
        // être uploadées qu'une fois le produit créé (l'endpoint d'upload
        // requiert un product_id existant).
        navigate(`/admin/products/${res.data.id}/edit`, { state: { product: res.data }, replace: true });
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setGeneralError('Unable to save this product.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Cas du rafraîchissement direct sur /admin/products/:id/edit : le produit
  // n'a pas été transmis via la navigation (pas d'endpoint "show" côté
  // backend pour le re-fetcher ici) — on guide l'admin vers la liste.
  if (isEdit && !product) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <AlertCircle className="mx-auto text-[#707070]" size={32} />
        <p className="text-sm text-[#707070]">
          This product couldn't be loaded directly. Please open it from the product list.
        </p>
        <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#F80000] hover:underline">
          <ArrowLeft size={15} />
          Back to Product Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#707070] hover:text-black transition-colors">
          <ArrowLeft size={13} />
          Back to Product Catalog
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-black">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[#e5e5e5] bg-white p-6">
        {generalError && <p className="text-sm text-[#F80000]">{generalError}</p>}

        <div>
          <label htmlFor="product-name" className="block text-xs font-semibold text-[#707070] mb-1">Name</label>
          <input
            id="product-name"
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
            required
          />
          {errors.name && <p className="mt-1 text-xs text-[#F80000]">{errors.name[0]}</p>}
        </div>

        <div>
          <label htmlFor="product-description" className="block text-xs font-semibold text-[#707070] mb-1">Description</label>
          <textarea
            id="product-description"
            rows={4}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
          />
          {errors.description && <p className="mt-1 text-xs text-[#F80000]">{errors.description[0]}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="product-price" className="block text-xs font-semibold text-[#707070] mb-1">Price (Rs)</label>
            <input
              id="product-price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
              required
            />
            {errors.price && <p className="mt-1 text-xs text-[#F80000]">{errors.price[0]}</p>}
          </div>

          <div>
            <label htmlFor="product-stock" className="block text-xs font-semibold text-[#707070] mb-1">Stock Quantity</label>
            <input
              id="product-stock"
              type="number"
              min="0"
              value={form.stock_qty}
              onChange={(e) => handleChange('stock_qty', e.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
              required
            />
            {errors.stock_qty && <p className="mt-1 text-xs text-[#F80000]">{errors.stock_qty[0]}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="product-category" className="block text-xs font-semibold text-[#707070] mb-1">Category</label>
          <select
            id="product-category"
            value={form.category_id}
            onChange={(e) => handleChange('category_id', e.target.value)}
            className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
            required
          >
            <option value="" disabled>Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="mt-1 text-xs text-[#F80000]">{errors.category_id[0]}</p>}
        </div>

        <label className="flex items-center gap-2 text-sm text-black">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
            className="rounded border-[#e5e5e5]"
          />
          Active (visible in public catalog)
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#e5e5e5]">
          <Link
            to="/admin/products"
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#e5e5e5] text-[#707070] hover:text-black hover:bg-[#F7F7F7] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#F80000] text-white hover:bg-[#C62221] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>

      {isEdit && product && (
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <ImageUploadGallery
            productId={product.id}
            images={product.images || []}
            onImagesChange={(newImages) => setProduct((prev) => ({ ...prev, images: newImages }))}
          />
        </div>
      )}
    </div>
  );
}