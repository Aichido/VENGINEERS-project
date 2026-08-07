import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, lastPage, onPageChange }) {
  if (lastPage <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-1 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm font-semibold text-[#707070] disabled:opacity-40"
      >
        <ChevronLeft size={16} />
        Previous
      </button>
      <span className="text-sm text-[#707070]">
        Page {page} of {lastPage}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(lastPage, page + 1))}
        disabled={page === lastPage}
        className="flex items-center gap-1 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm font-semibold text-[#707070] disabled:opacity-40"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}