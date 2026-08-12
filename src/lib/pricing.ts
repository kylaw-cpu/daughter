import type { PackageItem, PackageTemplate } from '@/api/types';

/**
 * Shared price math (all integer minor units). Used by the customize/review
 * screens for live totals and by the mock backend as the source of truth —
 * the real backend reprices server-side in Phase 4.
 */
export function priceItems(items: PackageItem[], template: PackageTemplate) {
  const perItemLocal = Math.round(template.basePriceLocal / Math.max(1, template.baseItems.length));
  const baseKeys = new Set(template.baseItems.map((b) => b.key));
  let amountLocal = 0;
  for (const it of items) {
    // Add-ons priced flat at ~12% of the base package each; base items pro-rata.
    const unit = baseKeys.has(it.key) ? perItemLocal : Math.round(template.basePriceLocal * 0.12);
    amountLocal += unit * it.quantity;
  }
  return amountLocal;
}

export function toSenderAmount(amountLocal: number, fxRate: number) {
  const amountSender = Math.round(amountLocal / fxRate);
  const serviceFee = Math.max(99, Math.round(amountSender * 0.05));
  return { amountSender, serviceFee, total: amountSender + serviceFee };
}

/** Plain-language coverage estimate: base package ≈ 2 weeks of support. */
export function coverageWeeks(items: PackageItem[], template: PackageTemplate): number {
  const baseLocal = template.basePriceLocal;
  if (baseLocal <= 0) return 2;
  const ratio = priceItems(items, template) / baseLocal;
  return Math.max(1, Math.round(ratio * 2));
}
