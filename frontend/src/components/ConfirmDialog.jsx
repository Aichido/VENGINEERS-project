import { AlertTriangle, Loader2, X } from 'lucide-react';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  submitting = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-5">
          <div className="flex items-start gap-3">
            <div
              className={[
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                danger ? 'bg-red-100 text-[#F80000]' : 'bg-[#ECB115]/20 text-[#8a6b0e]',
              ].join(' ')}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{title}</h2>
              <p className="mt-1 text-sm text-[#707070]">{message}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-[#707070] hover:text-black shrink-0" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#e5e5e5] bg-[#F7F7F7]">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#e5e5e5] text-[#707070] hover:text-black hover:bg-white disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={[
              'px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors flex items-center gap-2',
              danger ? 'bg-[#F80000] hover:bg-[#C62221]' : 'bg-black hover:bg-[#404040]',
            ].join(' ')}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}