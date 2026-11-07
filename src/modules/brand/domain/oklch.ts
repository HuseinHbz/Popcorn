import { clampByte, linearToSrgb, type Rgb8, srgbToLinear } from './colour';

/** Linear-light sRGB: each channel is 0–1 when the colour is in gamut, and outside it when not. */
export type LinearRgb = { readonly r: number; readonly g: number; readonly b: number };

/** OKLab: lightness `l` (0–1) and the opponent axes `a` (green–red) and `b` (blue–yellow). */
export type Oklab = { readonly l: number; readonly a: number; readonly b: number };

/** OKLCH: lightness `l` (0–1), chroma `c` (0 or more) and hue `h` in degrees (0 ≤ h < 360). */
export type Oklch = { readonly l: number; readonly c: number; readonly h: number };

/** Below this chroma a colour is achromatic, and converts to exactly equal channels. */
export const ACHROMATIC_CHROMA = 1e-6;

/**
 * Tolerance, per linear channel, of the gamut test used by `gamutMap`. The published OKLab
 * matrices invert each other only to about 6e-8, so an in-gamut colour can come back from OKLab
 * up to about 3e-7 outside 0–1; this absorbs that drift and stays far below half an 8-bit step
 * (about 1.5e-4 in linear light, near black).
 */
export const GAMUT_EPSILON = 1e-6;

/** Bisection steps in `gamutMap`: 32 halvings leave an error below 1e-9 for any chroma up to 4. */
const GAMUT_STEPS = 32;

const DEGREES_PER_RADIAN = 180 / Math.PI;

/** Linear sRGB to OKLab, with Björn Ottosson's published matrices (2020). */
export function linearToOklab({ r, g, b }: LinearRgb): Oklab {
  const long = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const medium = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const short = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    a: 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    b: 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  };
}

/** OKLab to linear sRGB, the inverse of `linearToOklab`; out-of-gamut colours leave 0–1. */
export function oklabToLinear({ l, a, b }: Oklab): LinearRgb {
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: 4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    g: -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    b: -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  };
}

/** Wraps any angle in degrees into 0 ≤ h < 360. */
export function normaliseHue(degrees: number): number {
  const turn = degrees % 360;
  // A tiny negative turn plus 360 can round to 360, so wrap once more; `+ 0` turns -0 into 0.
  return turn < 0 ? (turn + 360) % 360 : turn + 0;
}

/** An 8-bit sRGB colour in OKLCH. */
export function toOklch(rgb: Rgb8): Oklch {
  const lab = linearToOklab({
    r: srgbToLinear(rgb.r / 255),
    g: srgbToLinear(rgb.g / 255),
    b: srgbToLinear(rgb.b / 255),
  });
  return {
    l: lab.l,
    c: Math.hypot(lab.a, lab.b),
    h: normaliseHue(Math.atan2(lab.b, lab.a) * DEGREES_PER_RADIAN),
  };
}

/**
 * OKLCH to linear sRGB, without clamping or gamut mapping. An achromatic colour (chroma below
 * `ACHROMATIC_CHROMA`) gives exactly equal channels, so a grey stays a grey after rounding.
 */
export function oklchToLinear({ l, c, h }: Oklch): LinearRgb {
  if (c < ACHROMATIC_CHROMA) {
    const grey = l ** 3;
    return { r: grey, g: grey, b: grey };
  }
  const radians = h / DEGREES_PER_RADIAN;
  return oklabToLinear({ l, a: c * Math.cos(radians), b: c * Math.sin(radians) });
}

/** Whether every linear channel lies in 0–1, allowing `epsilon` on either side. NaN never does. */
export function inGamut(linear: LinearRgb, epsilon: number): boolean {
  return [linear.r, linear.g, linear.b].every(
    (channel) => channel >= -epsilon && channel <= 1 + epsilon,
  );
}

/**
 * Brings a colour into the sRGB gamut by lowering chroma only (bisection), keeping hue and the
 * lightness clamped to 0–1. An in-gamut colour is returned with its chroma unchanged; a negative
 * chroma is read as 0, and a chroma with no in-gamut value found (NaN, infinite) falls to grey.
 * A lightness that is not a finite number throws a RangeError: clamped, NaN would become black,
 * which passes a contrast check on a light background, so a bug upstream would ship a wrong
 * colour instead of failing.
 */
export function gamutMap(lch: Oklch): Oklch {
  if (!Number.isFinite(lch.l)) {
    throw new RangeError(`OKLCH lightness must be a finite number, got ${String(lch.l)}`);
  }
  const l = Math.min(1, Math.max(0, lch.l));
  const { h } = lch;
  const fits = (c: number): boolean => inGamut(oklchToLinear({ l, c, h }), GAMUT_EPSILON);
  const wanted = Math.max(0, lch.c);
  if (fits(wanted)) return { l, c: wanted, h };
  // Grey (chroma 0) is in gamut for every lightness in 0–1, so `low` always fits.
  let low = 0;
  let high = wanted;
  for (let step = 0; step < GAMUT_STEPS; step += 1) {
    const middle = (low + high) / 2;
    if (fits(middle)) low = middle;
    else high = middle;
  }
  return { l, c: low, h };
}

function linearToByte(channel: number): number {
  return clampByte(linearToSrgb(channel) * 255);
}

/** OKLCH to an 8-bit sRGB colour: gamut-mapped (`gamutMap`), then rounded per channel. */
export function oklchToRgb8(lch: Oklch): Rgb8 {
  const { r, g, b } = oklchToLinear(gamutMap(lch));
  return { r: linearToByte(r), g: linearToByte(g), b: linearToByte(b) };
}
