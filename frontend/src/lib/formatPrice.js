// Shared price formatter for the Products grid and product cards.
// Prices are stored as plain numbers (MUR) — no currency field in the schema yet.
// Always shows exactly 2 decimal places so precise values (e.g. 75000.23) aren't truncated.

export function formatPrice(value) {
  const amount = Number(value) || 0
  return `Rs ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}