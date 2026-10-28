import { DEFAULT_LOCALE, type Locale } from './locale';

export type JalaliStyle = 'long' | 'short' | 'dateTime';

const CALENDAR_LOCALES: Record<Locale, string> = {
  fa: 'fa-IR-u-ca-persian',
  en: 'en-US-u-ca-persian',
};

const STYLES: Record<JalaliStyle, Intl.DateTimeFormatOptions> = {
  long: { dateStyle: 'long' },
  short: { dateStyle: 'short' },
  dateTime: { dateStyle: 'medium', timeStyle: 'short' },
};

/**
 * Formats an instant (stored as UTC `timestamptz`) as a Jalali date in Asia/Tehran
 * (CLAUDE.md). Throws `RangeError` for an invalid date.
 */
export function formatJalali(
  date: Date,
  locale: Locale = DEFAULT_LOCALE,
  style: JalaliStyle = 'long',
): string {
  return new Intl.DateTimeFormat(CALENDAR_LOCALES[locale], {
    ...STYLES[style],
    timeZone: 'Asia/Tehran',
  }).format(date);
}
