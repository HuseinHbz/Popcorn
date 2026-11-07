// Pure domain logic of the brand module: colour parsing and formatting, OKLCH, WCAG contrast,
// the brand catalogue, and the accent family and its check (ADR 0019). No framework, database
// or I/O (CLAUDE.md).
export {
  type AccentColours,
  type AccentFamily,
  type AccentSteps,
  deriveAccentColours,
  deriveAccentFamily,
  type Theme,
  type ThemeContext,
  THEMES,
} from './accent';
export {
  BRAND_SLUGS,
  type BrandSlug,
  IDENTITIES,
  type Identity,
  isBrandSlug,
  isIdentity,
} from './catalogue';
export {
  ACCENT_RULES,
  type AccentCheck,
  type AccentRule,
  checkAccent,
  type NearestPassing,
  REQUIRED_RATIO,
  type RuleFailure,
} from './check';
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
