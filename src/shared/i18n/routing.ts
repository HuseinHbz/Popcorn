import { defineRouting } from 'next-intl/routing';

import { DEFAULT_LOCALE, LOCALES } from '@/shared/lib/locale';

/** Persian is the default locale; English is second (project plan §5). */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  // `/` always lands on Persian; visitors switch language explicitly.
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];

const RTL_LOCALES: ReadonlySet<AppLocale> = new Set(['fa']);

/** Text direction for a locale; drives `<html dir>`. */
export function directionOf(locale: AppLocale): 'rtl' | 'ltr' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}
