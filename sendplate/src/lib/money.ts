/**
 * Money helpers. All amounts are integer minor units (cents) end-to-end
 * (spec §10) — only formatting converts to display values.
 */

export function formatMoney(minorUnits: number, currency: string, locale?: string): string {
  const amount = minorUnits / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    // Unknown currency code — fall back to a plain readable string.
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Convert local-currency minor units to sender-currency minor units. */
export function localToSender(localMinor: number, fxRate: number): number {
  return Math.round(localMinor / fxRate);
}

/** Convert sender-currency minor units to local-currency minor units. */
export function senderToLocal(senderMinor: number, fxRate: number): number {
  return Math.round(senderMinor * fxRate);
}
