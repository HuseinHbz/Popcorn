// Pure domain logic of the brand module: colour parsing and formatting, OKLCH, WCAG contrast
// and the brand catalogue (ADR 0019). No framework, database or I/O (CLAUDE.md).
export {
  BRAND_SLUGS,
  type BrandSlug,
  IDENTITIES,
  type Identity,
  isBrandSlug,
  isIdentity,
} from './catalogue';
export { clampByte, formatHex, linearToSrgb, parseHex, type Rgb8, srgbToLinear } from './colour';
export { contrastRatio, floorRatio, meetsRatio, relativeLuminance } from './contrast';
export {
  ACHROMATIC_CHROMA,
  GAMUT_EPSILON,
  gamutMap,
  inGamut,
  type LinearRgb,
  linearToOklab,
  normaliseHue,
  type Oklab,
  oklabToLinear,
  type Oklch,
  oklchToLinear,
  oklchToRgb8,
  toOklch,
} from './oklch';
