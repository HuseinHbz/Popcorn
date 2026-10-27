import type { FormatLocale } from './locale';

const IRR_PER_TOMAN = 10n;
const HALF = IRR_PER_TOMAN / 2n;

/** Converts Rial to Toman, rounding half away from zero (ADR 0006: amounts are BIGINT Rial). */
export function irrToToman(irr: bigint): bigint {
  const toman = irr / IRR_PER_TOMAN;
  const remainder = irr % IRR_PER_TOMAN;
  if (remainder >= HALF) return toman + 1n;
  if (remainder <= -HALF) return toman - 1n;
  return toman;
}

const NUMBER_LOCALES: Record<FormatLocale, string> = { fa: 'fa-IR', en: 'en-US' };

/**
 * Formats a Rial amount as a grouped Toman number (Persian digits for `fa`).
 * The unit word ("تومان" / "Toman") comes from the message catalogue, not from here,
 * so every user-facing word stays in next-intl.
 */
export function formatToman(irr: bigint, locale: FormatLocale = 'fa'): string {
  return new Intl.NumberFormat(NUMBER_LOCALES[locale]).format(irrToToman(irr));
}
