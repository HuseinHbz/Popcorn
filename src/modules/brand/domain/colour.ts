/** An opaque sRGB colour with integer 8-bit channels (0–255). */
export type Rgb8 = { readonly r: number; readonly g: number; readonly b: number };

/** Only an opaque `#rrggbb`, in either case: no shorthand, alpha, whitespace or trailing text. */
const HEX = /^#[0-9a-f]{6}$/i;

/** Parses an opaque `#rrggbb` (either case); anything else, including shorthand, is `null`. */
export function parseHex(input: string): Rgb8 | null {
  if (!HEX.test(input)) return null;
  return {
    r: Number.parseInt(input.slice(1, 3), 16),
    g: Number.parseInt(input.slice(3, 5), 16),
    b: Number.parseInt(input.slice(5, 7), 16),
  };
}

/**
 * Rounds a channel (half up) and clamps it to 0–255. NaN becomes 0, so the result is always a
 * byte, whatever arithmetic produced the input.
 */
export function clampByte(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hexByte(value: number): string {
  return clampByte(value).toString(16).padStart(2, '0');
}

/** Formats a colour as lowercase `#rrggbb`, clamping and rounding each channel first. */
export function formatHex(rgb: Rgb8): string {
  return `#${hexByte(rgb.r)}${hexByte(rgb.g)}${hexByte(rgb.b)}`;
}

/**
 * The sRGB transfer function, encoded (0–1) to linear light (0–1). Below the threshold the curve
 * is a straight line, which also extends it to negative values without NaN.
 */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** The inverse sRGB transfer function, linear light (0–1) to encoded (0–1). */
export function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}
