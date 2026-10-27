const PERSIAN_ZERO = 0x06f0;
const ARABIC_INDIC_ZERO = 0x0660;

/** Replaces Latin (0–9) and Arabic-Indic (٠–٩) digits with Persian digits (۰–۹). */
export function toPersianDigits(value: string | number | bigint): string {
  return String(value).replace(/[0-9٠-٩]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const offset = code >= ARABIC_INDIC_ZERO ? code - ARABIC_INDIC_ZERO : code - 48;
    return String.fromCharCode(PERSIAN_ZERO + offset);
  });
}
