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
 * per glyph. Each face declares its subset's `unicode-range`, copied from
 * `@fontsource` 5.3.0 `unicode.json`, so a browser downloads a face only for text it
 * covers. next/font only accepts literal options, so the Latin range is repeated.
 * The Arabic range adds U+0020 and U+00A0, whose glyphs the Arabic file contains:
 * CSS takes line metrics from the first face whose range covers the space, so without
 * them a Persian heading would download the next face (Shippori) and use none of it. `adjustFontFallback` is off because Next's generated fallback
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
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    },
  ],
  display: 'swap',
  adjustFontFallback: false,
});

export const vazirmatnArabic = localFont({
  src: [
    { path: './files/vazirmatn-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './files/vazirmatn-arabic-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-vazirmatn-arabic',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0020,U+00A0,U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1',
    },
  ],
  display: 'swap',
  adjustFontFallback: false,
});

/**
 * Shippori Mincho (OFL-1.1, see `files/OFL-shippori-mincho.txt`), Latin display face
 * (ADR 0012), Latin subset only. Not preloaded, and never downloaded on Persian pages:
 * their heading stack leads with the Persian slot (globals.css), whose range covers the
 * space, so Shippori is fetched only when a heading contains Latin letters.
 * Weights beyond 400 arrive with the Phase 1 type scale.
 */
export const shipporiMincho = localFont({
  src: './files/shippori-mincho-latin-400-normal.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-shippori-mincho',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    },
  ],
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
