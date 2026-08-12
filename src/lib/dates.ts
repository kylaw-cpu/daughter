import type { TFunction } from 'i18next';

export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** Friendly relative time for feed rows ("Today", "3 days ago"). */
export function friendlyWhen(iso: string, t: TFunction): string {
  const deltaDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (deltaDays <= 0) {
    const deltaMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (deltaMin < 60) return t('common.justNow');
    return t('common.today');
  }
  if (deltaDays === 1) return t('common.yesterday');
  return t('common.daysAgo', { count: deltaDays });
}
