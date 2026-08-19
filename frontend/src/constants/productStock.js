// Seuil d'alerte "stock bas" — purement visuel côté front, à ajuster si un
// jour piloté par une valeur métier côté backend.
export const LOW_STOCK_THRESHOLD = 5;

export function stockStatus(qty) {
  if (qty <= 0) return { label: 'Out of Stock', tone: 'bg-red-100 text-[#C62221]' };
  if (qty <= LOW_STOCK_THRESHOLD) return { label: 'Low Stock', tone: 'bg-[#ECB115]/20 text-[#8a6b0e]' };
  return { label: 'In Stock', tone: 'bg-green-100 text-green-700' };
}