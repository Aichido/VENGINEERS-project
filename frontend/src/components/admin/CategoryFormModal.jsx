import { useEffect, useState } from 'react';
import { X, Loader2, FolderTree } from 'lucide-react';
import api from '../../services/api';

const EMPTY_FORM = { name: '', slug: '' };

export default function CategoryFormModal({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (category) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise le formulaire avec la catégorie sélectionnée, pas de cascade de rendus réelle ici
      setForm({ name: category.name || '', slug: category.slug || '' });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setGeneralError('');
  }, [category]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError('');

    // slug vide → laisser le backend le générer automatiquement à partir du name
    const payload = { name: form.name, ...(form.slug ? { slug: form.slug } : {}) };

    try {
      if (isEdit) {
        const res = await api.put(`/admin/categories/${category.id}`, payload);
        onSaved(res.data);
      } else {
        const res = await api.post('/admin/categories', payload);
        onSaved(res.data);
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setGeneralError('Unable to save this category.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e5e5] bg-[#F7F7F7]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F80000]/10 text-[#F80000]">
              <FolderTree size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{isEdit ? 'Edit Category' : 'New Category'}</h2>
              <p className="text-xs text-[#707070]">{isEdit ? category.slug : 'Add a product category'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#707070] hover:text-black" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {generalError && <p className="text-sm text-[#F80000]">{generalError}</p>}

          <div>
            <label htmlFor="category-name" className="block text-xs font-semibold text-[#707070] mb-1">Name</label>
            <input
              id="category-name"
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
              required
            />
            {errors.name && <p className="mt-1 text-xs text-[#F80000]">{errors.name[0]}</p>}
          </div>

          <div>
            <label htmlFor="category-slug" className="block text-xs font-semibold text-[#707070] mb-1">
              Slug <span className="font-normal normal-case text-[#707070]">(optional — auto-generated from name if left blank)</span>
            </label>
            <input
              id="category-slug"
              type="text"
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="e.g. interactive-displays"
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F80000]/30"
            />
            {errors.slug && <p className="mt-1 text-xs text-[#F80000]">{errors.slug[0]}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#e5e5e5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#e5e5e5] text-[#707070] hover:text-black hover:bg-[#F7F7F7] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#F80000] text-white hover:bg-[#C62221] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}