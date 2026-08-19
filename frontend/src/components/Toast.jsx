import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const TONE = {
  success: { icon: CheckCircle2, iconColor: 'text-green-600', bar: 'bg-green-600' },
  error: { icon: XCircle, iconColor: 'text-[#F80000]', bar: 'bg-[#F80000]' },
};

export default function Toast({ message, type = 'success', onDismiss }) {
  const [visible, setVisible] = useState(false);
  const { icon: Icon, iconColor, bar } = TONE[type] || TONE.success;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={[
        'relative flex items-center gap-3 min-w-[280px] max-w-sm rounded-lg bg-white shadow-lg border border-[#e5e5e5]',
        'px-4 py-3 transition-all duration-200',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
      role="status"
    >
      <Icon size={18} className={`shrink-0 ${iconColor}`} />
      <p className="flex-1 text-sm text-black">{message}</p>
      <button onClick={onDismiss} className="text-[#707070] hover:text-black shrink-0" aria-label="Dismiss">
        <X size={15} />
      </button>
      <span className={`absolute left-0 bottom-0 h-0.5 w-full rounded-b-lg ${bar}`} />
    </div>
  );
}