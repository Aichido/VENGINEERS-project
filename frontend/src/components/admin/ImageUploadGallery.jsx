import { useRef, useState } from 'react';
import { Star, Trash2, ArrowUp, ArrowDown, Upload, Loader2, ImageOff } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const MAX_IMAGES = 5;

export default function ImageUploadGallery({ productId, images, onImagesChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
   const { showToast } = useToast();

  const sorted = [...images].sort((a, b) => a.position - b.position);

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier ensuite
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post(`/admin/products/${productId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onImagesChange([...images, res.data]);
      showToast('Image uploaded successfully.');
    } catch (err) {
      setError(err.response?.status === 422 ? err.response.data?.message : 'Unable to upload this image.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(image) {
    setBusyId(image.id);
    setError('');
    try {
      await api.delete(`/admin/products/${productId}/images/${image.id}`);
      // Le backend promeut automatiquement une nouvelle image primaire en
      // cas de suppression de l'ancienne primary ; on reflète localement en
      // promouvant la première image restante par position (comportement
      // attendu côté ProductImageService, à confirmer visuellement après
      // suppression réelle).
      const remaining = images.filter((img) => img.id !== image.id);
      if (image.is_primary && remaining.length > 0) {
        const sortedRemaining = [...remaining].sort((a, b) => a.position - b.position);
        sortedRemaining[0] = { ...sortedRemaining[0], is_primary: true };
        onImagesChange(sortedRemaining);
      } else {
        onImagesChange(remaining);
      }
      showToast('Image deleted successfully.');
    } catch {
      setError('Unable to delete this image.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSetPrimary(image) {
    setBusyId(image.id);
    setError('');
    try {
      const res = await api.patch(`/admin/products/${productId}/images/${image.id}/set-primary`);
      onImagesChange(res.data);
       showToast('Primary image updated.');
    } catch {
      setError('Unable to set this image as primary.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReorder(image, direction) {
    const currentOrder = sorted.map((img) => img.id);
    const index = currentOrder.indexOf(image.id);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= currentOrder.length) return;

    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[swapWith]] = [newOrder[swapWith], newOrder[index]];

    setBusyId(image.id);
    setError('');
    try {
      const res = await api.patch(`/admin/products/${productId}/images/reorder`, { image_ids: newOrder });
      onImagesChange(res.data);
    } catch {
      setError('Unable to reorder images.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#707070]">
          Product Images ({images.length}/{MAX_IMAGES})
        </h3>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= MAX_IMAGES}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e5e5e5] text-[#707070] hover:text-black hover:bg-[#F7F7F7] disabled:opacity-50 transition-colors"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {error && <p className="text-xs text-[#F80000]">{error}</p>}

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#e5e5e5] py-10 text-[#707070]">
          <ImageOff size={24} />
          <p className="text-xs">No images yet. Upload up to {MAX_IMAGES}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sorted.map((image, idx) => (
            <div key={image.id} className="relative rounded-lg border border-[#e5e5e5] overflow-hidden bg-[#F7F7F7]">
              <img src={image.thumbnail_url || image.url} alt="" className="h-28 w-full object-cover" />

              {image.is_primary && (
                <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-[#ECB115] px-2 py-0.5 text-[10px] font-bold text-black">
                  <Star size={10} fill="black" /> Primary
                </span>
              )}

              <div className="flex items-center justify-between gap-1 px-1.5 py-1.5 bg-white">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleReorder(image, 'up')}
                    disabled={busyId === image.id || idx === 0}
                    title="Move left"
                    className="p-1 rounded text-[#707070] hover:text-black hover:bg-[#F7F7F7] disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorder(image, 'down')}
                    disabled={busyId === image.id || idx === sorted.length - 1}
                    title="Move right"
                    className="p-1 rounded text-[#707070] hover:text-black hover:bg-[#F7F7F7] disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-0.5">
                  {!image.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(image)}
                      disabled={busyId === image.id}
                      title="Set as primary"
                      className="p-1 rounded text-[#707070] hover:text-[#ECB115] hover:bg-[#F7F7F7] disabled:opacity-30 transition-colors"
                    >
                      <Star size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(image)}
                    disabled={busyId === image.id}
                    title="Delete"
                    className="p-1 rounded text-[#F80000] hover:bg-red-50 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}