import { type Rgb8, srgbToLinear } from './colour';

/**
 * WCAG 2 relative luminance, 0 for black and 1 for white. The transfer threshold is the sRGB
 * standard's 0.04045; WCAG 2.0 printed 0.03928, which differs for no 8-bit channel value.
 */
export function relativeLuminance(rgb: Rgb8): number {
  return (
    0.2126 * srgbToLinear(rgb.r / 255) +
    0.7152 * srgbToLinear(rgb.g / 255) +
    0.0722 * srgbToLinear(rgb.b / 255)
  );
}

/** WCAG 2 contrast ratio, 1 to 21: unrounded, and the same whichever colour comes first. */
export function contrastRatio(a: Rgb8, b: Rgb8): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/**
 * A ratio rounded down to two decimals, for messages only: a failing 2.996 reads 2.99, never
 * 3.00. Decide pass or fail with `meetsRatio` on the unrounded value, not with this.
 */
export function floorRatio(ratio: number): number {
  return Math.floor(ratio * 100) / 100;
}

/** Whether a ratio meets a requirement, compared unrounded: 2.996 fails 3 and 4.5 meets 4.5. */
export function meetsRatio(ratio: number, required: number): boolean {
  return ratio >= required;
}
