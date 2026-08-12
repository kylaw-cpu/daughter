import i18n from '@/i18n';

/** Friendly relative day formatting: "Today", "Yesterday", "3 days ago". */
export function friendlyWhen(iso: string): string {
  const days = Math.floor((Date.now() - Date.parse(iso)) / (24 * 3600 * 1000));
  if (days <= 0) return i18n.t('common.today');
  if (days === 1) return i18n.t('common.yesterday');
  return i18n.t('common.daysAgo', { count: days });
}

/** Whole days until an ISO timestamp (min 0). */
export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / (24 * 3600 * 1000)));
}

/** Locale-aware absolute date-time for detail views. */
export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}
