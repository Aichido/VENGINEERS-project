import { useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import api from '../services/api';

// Matches backend StoreInterventionReportRequest validation:
// required|file|mimes:pdf,jpg,jpeg,png,docx|max:10240 (10MB)
const ACCEPTED_EXT = '.pdf,.jpg,.jpeg,.png,.docx';

export default function ReportUploadForm({ interventionPublicId, onSuccess }) {
  const [contenu, setContenu] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function handleFileChange(selected) {
    if (!selected) return;
    setFile(selected);
    setErrors((prev) => ({ ...prev, fichier: '' }));
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files?.[0]);
  }

  async function handleSubmit() {
    setErrors({});

    if (!file) {
      setErrors({ fichier: 'A file is required to submit the report.' });
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('contenu', contenu);
    formData.append('fichier', file);

    try {
      const res = await api.post(
        `/technicien/interventions/${encodeURIComponent(interventionPublicId)}/report`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setContenu('');
      setFile(null);
      onSuccess?.(res.data);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data?.errors || {});
      } else {
        setErrors({ general: 'Unable to submit this report.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="report-contenu"
          className="block text-xs font-semibold uppercase tracking-wide text-[#707070] mb-2"
        >
          Field findings
        </label>
        <textarea
          id="report-contenu"
          rows={6}
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder="Describe the technical status, completed steps, and any anomalies discovered..."
          className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#F80000]/30 focus:border-[#F80000]"
        />
        {errors.contenu && (
          <p className="mt-1 text-xs text-[#F80000]">
            {Array.isArray(errors.contenu) ? errors.contenu[0] : errors.contenu}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="block text-xs font-semibold uppercase tracking-wide text-[#707070]">
            Documentation
          </span>
          <span className="text-xs text-[#707070]">PDF, JPG, PNG, DOCX — max 10MB</span>
        </div>

        <label
          htmlFor="report-file"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e5e5e5] bg-[#F7F7F7] py-10 cursor-pointer hover:border-[#F80000]/40 transition-colors"
        >
          <UploadCloud size={28} className="text-[#F80000]" />
          <span className="text-sm text-black">
            Drag and drop a file or{' '}
            <span className="font-semibold text-[#F80000] underline">browse</span>
          </span>
          <input
            id="report-file"
            type="file"
            accept={ACCEPTED_EXT}
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
        </label>

        {file && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-black">
              <FileText size={16} className="text-[#707070]" />
              {file.name}
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-[#707070] hover:text-[#F80000]"
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {errors.fichier && (
          <p className="mt-1 text-xs text-[#F80000]">
            {Array.isArray(errors.fichier) ? errors.fichier[0] : errors.fichier}
          </p>
        )}
      </div>

      {errors.general && <p className="text-sm text-[#F80000]">{errors.general}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white hover:bg-[#404040] disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
    </div>
  );
}
