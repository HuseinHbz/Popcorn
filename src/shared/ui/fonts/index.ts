import localFont from 'next/font/local';

/**
 * Vazirmatn (OFL-1.1, see `files/OFL-vazirmatn.txt`) body face, self-hosted
 * (ADR 0008, ADR 0012). Files are vendored from `@fontsource/vazirmatn` 5.3.0
 * so the build does not depend on the package manager's directory layout.
 *
 * Static 400/700 instead of the variable font: on throttled mobile, shaping
 * Persian text with the variable font cost ~270 ms of layout and pushed
 * Lighthouse performance below 95 (ADR 0017). Add a weight only when a design uses it.
 *
 * The Latin and Arabic-script subsets are separate families; the browser picks
 * per glyph. `adjustFontFallback` is off because Next's generated fallback
 * (`local("Arial")`) has no unicode-range and would sit between the two subsets
 * in the stack, so Persian text would render in Arial on systems that have it.
 * The fallback stack is declared once, after both subsets (globals.css).
 */
export const vazirmatnLatin = localFont({
  src: [
    { path: './files/vazirmatn-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './files/vazirmatn-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-vazirmatn-latin',
  display: 'swap',
  adjustFontFallback: false,
});

export const vazirmatnArabic = localFont({
  src: [
    { path: './files/vazirmatn-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './files/vazirmatn-arabic-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-vazirmatn-arabic',
  display: 'swap',
  adjustFontFallback: false,
});

/**
 * Shippori Mincho (OFL-1.1, see `files/OFL-shippori-mincho.txt`), Latin display face
 * (ADR 0012), Latin subset only. Not preloaded: on Persian pages its glyphs are unused.
 * Weights beyond 400 arrive with the Phase 1 type scale.
 */
export const shipporiMincho = localFont({
  src: './files/shippori-mincho-latin-400-normal.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-shippori-mincho',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

/**
 * Peyda, the Persian headline face (ADR 0012), is licensed commercially, so its files
 * must never be committed while the repository is public (risk register). Its slot is
 * the `--font-heading-fa` variable in globals.css, which uses Vazirmatn until the
 * licence and files arrive; adding Peyda means a `localFont` here and one line there.
 */
