/** All money values are integer minor units (cents). Format only at the edge. */

export function formatMoney(minorUnits: number, currency: string, locale?: string): string {
  const amount = minorUnits / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
