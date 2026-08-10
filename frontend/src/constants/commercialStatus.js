
export const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'en_attente', label: 'Pending' },
  { value: 'validee', label: 'Validated' },
  { value: 'expediee', label: 'Shipped' },
  { value: 'livree', label: 'Delivered' },
  { value: 'annulee', label: 'Cancelled' },
];

export const STATUS_BADGE = {
  en_attente: 'bg-[#ECB115]/20 text-[#a67a0d]',
  validee: 'bg-emerald-100 text-emerald-700',
  expediee: 'bg-blue-100 text-blue-700',
  livree: 'bg-[#F7F7F7] text-[#707070]',
  annulee: 'bg-red-100 text-[#F80000]',
};

export const STATUS_LABELS = {
  en_attente: 'Pending',
  validee: 'Validated',
  expediee: 'Shipped',
  livree: 'Delivered',
  annulee: 'Cancelled',
};