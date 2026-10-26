import localFont from 'next/font/local';

/**
 * Vazirmatn (OFL) body face, self-hosted from `@fontsource-variable/vazirmatn`
 * (ADR 0008, ADR 0012). Two subsets are declared as separate families so the
 * browser falls back per glyph: Latin glyphs from `latin`, Persian from `arabic`.
 * Peyda (headlines) and Shippori Mincho (Latin display) arrive in Phase 1.
 */
export const vazirmatnLatin = localFont({
  src: '../../../../node_modules/@fontsource-variable/vazirmatn/files/vazirmatn-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-vazirmatn-latin',
  display: 'swap',
});

export const vazirmatnArabic = localFont({
  src: '../../../../node_modules/@fontsource-variable/vazirmatn/files/vazirmatn-arabic-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-vazirmatn-arabic',
  display: 'swap',
});
