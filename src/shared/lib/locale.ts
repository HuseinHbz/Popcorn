/**
 * The site's locales (project plan §5): Persian first and default, then English. The single
 * source for routing (shared/i18n) and for the pure formatters in this folder.
 */
export const LOCALES = ['fa', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fa';
