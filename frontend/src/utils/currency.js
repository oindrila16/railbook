/**
 * Format prices in Bangladeshi Taka (BDT).
 */
const bdtFormatter = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatBDT(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '৳0';
  return bdtFormatter.format(Number(amount));
}
