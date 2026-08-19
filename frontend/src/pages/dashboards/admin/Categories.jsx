import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
import api from '../../../services/api';
import CategoryFormModal from '../../../components/admin/CategoryFormModal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useToast } from '../../../context/ToastContext';

export default function Categories() {
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalCategory, setModalCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
   const { showToast } = useToast();

  function loadCategories() {
    setLoading(true);
    setError('');
    api
      .get('/categories')
      .then((res) => setCategories(res.data))
      .catch(() => setError('Unable to load categories.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- charge une fois au montage, pas de cascade de rendus réelle ici
    loadCategories();
  }, []);

  function openCreate() {
    setModalCategory(null);
    setModalOpen(true);
  }

  function openEdit(category) {
    setModalCategory(category);
    setModalOpen(true);
  }

  function handleSaved(savedCategory) {
    setModalOpen(false);
    showToast(modalCategory ? 'Category updated successfully.' : 'Category created successfully.');
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === savedCategory.id);
      return exists
        ? prev.map((c) => (c.id === savedCategory.id ? savedCategory : c))
        : [...prev, savedCategory];
    });
  }

  function openDelete(category) {
    setDeleteError('');
    setDeleteTarget(category);
  }

  async function confirmDelete() {
    const category = deleteTarget;
    if (!category) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/admin/categories/${category.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      setDeleteTarget(null);
      showToast('Category deleted successfully.');
    } catch (err) {
      // Protection FK backend : 422 si des produits sont encore rattachés
      setDeleteError(
        err.response?.status === 422
          ? err.response.data?.message || 'This category still has products attached.'
          : 'Unable to delete this category.'
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Categories</h1>
          <p className="text-sm text-[#707070]">Organize the product catalog.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#F80000] text-white hover:bg-[#C62221] transition-colors"
        >
          <Plus size={16} />
          New Category
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#F80000]" />
        </div>
      )}

      {!loading && error && <p className="text-sm text-[#F80000]">{error}</p>}

      {!loading && !error && categories && (
        categories.length === 0 ? (
          <p className="text-sm text-[#707070]">No categories yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#707070] border-b border-[#e5e5e5] bg-[#F7F7F7]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#F7F7F7]/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F80000]/10 text-[#F80000]">
                          <FolderTree size={16} />
                        </div>
                        <span className="font-semibold text-black">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#707070]">{category.slug}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(category)}
                          title="Edit"
                          className="p-2 rounded-lg text-[#707070] hover:text-black hover:bg-[#F7F7F7] transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => openDelete(category)}
                          title="Delete"
                          className="p-2 rounded-lg text-[#F80000] hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {modalOpen && (
        <CategoryFormModal category={modalCategory} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete category"
          message={
            deleteError ||
            `Delete "${deleteTarget.name}"? This is only possible if no products are attached to it.`
          }
          confirmLabel="Delete"
          submitting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}