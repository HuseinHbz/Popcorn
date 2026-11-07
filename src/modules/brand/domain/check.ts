import {
  type AccentColours,
  type AccentFamily,
  deriveAccentColours,
  deriveAccentFamily,
  type ThemeContext,
} from './accent';
import { formatHex, parseHex, type Rgb8 } from './colour';
import { contrastRatio, floorRatio, meetsRatio } from './contrast';
import { type Oklch, oklchToRgb8, toOklch } from './oklch';

/** Every rule asks for normal-size text contrast (WCAG 1.4.3 AA), so the accent may colour links. */
export const REQUIRED_RATIO = 4.5;

/**
 * The rules, as foreground on background:
 * - `accent`, `hover`, `pressed`: each on the theme background;
 * - `on-accent`, `on-hover`, `on-pressed`: the on-accent text on each of the three;
 * - `text-on-subtle`, `muted-on-subtle`: primary and secondary text on the subtle colour.
 */
export const ACCENT_RULES = [
  'accent',
  'hover',
  'pressed',
  'on-accent',
  'on-hover',
  'on-pressed',
  'text-on-subtle',
  'muted-on-subtle',
] as const;

export type AccentRule = (typeof ACCENT_RULES)[number];

/** A failing rule: its ratio rounded down to two decimals (a failure never reads 4.50). */
export type RuleFailure = {
  readonly rule: AccentRule;
  readonly measured: number;
  readonly required: number;
};

/** The passing colour nearest the input: its OKLCH lightness, and the colour as `#rrggbb`. */
export type NearestPassing = { readonly l: number; readonly hex: string };

export type AccentCheck =
  | { readonly status: 'invalid' }
  | {
      readonly status: 'rejected';
      readonly failures: readonly RuleFailure[];
      readonly nearest: NearestPassing | null;
    }
  | { readonly status: 'accepted'; readonly family: AccentFamily };

/** Lightness search: steps of 0.01 outward from the input, then bisection to below 1e-5. */
const SEARCH_STEP = 0.01;
const SEARCH_STEPS = Math.ceil(1 / SEARCH_STEP);
const REFINE_STEPS = 10;

function pairsOf(ctx: ThemeContext, f: AccentColours): Record<AccentRule, [Rgb8, Rgb8]> {
  return {
    accent: [f.accent, ctx.background],
    hover: [f.hover, ctx.background],
    pressed: [f.pressed, ctx.background],
    'on-accent': [f.onAccent, f.accent],
    'on-hover': [f.onAccent, f.hover],
    'on-pressed': [f.onAccent, f.pressed],
    'text-on-subtle': [ctx.text, f.subtle],
    'muted-on-subtle': [ctx.mutedText, f.subtle],
  };
}

/** The rules a colour fails, in `ACCENT_RULES` order, each decided on the unrounded ratio. */
function failuresOf(ctx: ThemeContext, accent: Rgb8): RuleFailure[] {
  const pairs = pairsOf(ctx, deriveAccentColours(ctx, accent));
  return ACCENT_RULES.flatMap((rule) => {
    const ratio = contrastRatio(...pairs[rule]);
    return meetsRatio(ratio, REQUIRED_RATIO)
      ? []
      : [{ rule, measured: floorRatio(ratio), required: REQUIRED_RATIO }];
  });
}

function passesAt(ctx: ThemeContext, input: Oklch, l: number): boolean {
  return failuresOf(ctx, oklchToRgb8({ l, c: input.c, h: input.h })).length === 0;
}

/** Bisects between a failing and a passing lightness; returns a passing one within 1e-5. */
function refine(ctx: ThemeContext, input: Oklch, failing: number, passing: number): number {
  let fail = failing;
  let pass = passing;
  for (let step = 0; step < REFINE_STEPS; step += 1) {
    const middle = (fail + pass) / 2;
    if (passesAt(ctx, input, middle)) pass = middle;
    else fail = middle;
  }
  return pass;
}

/** The lightness `index` steps from the input in `direction`, clamped to 0–1. */
function stepped(input: Oklch, direction: number, index: number): number {
  return Math.min(1, Math.max(0, input.l + direction * index * SEARCH_STEP));
}

/** Whether that step is still searched: the step that crosses 0 or 1 is, clamped; later not. */
function inRange(input: Oklch, direction: number, index: number): boolean {
  const raw = input.l + direction * index * SEARCH_STEP;
  return raw > -SEARCH_STEP && raw < 1 + SEARCH_STEP;
}

/** The refined passing lightness at that step in that direction, or null if it fails there. */
function passingAt(
  ctx: ThemeContext,
  input: Oklch,
  direction: number,
  index: number,
): number | null {
  if (!inRange(input, direction, index)) return null;
  const l = stepped(input, direction, index);
  if (!passesAt(ctx, input, l)) return null;
  return refine(ctx, input, stepped(input, direction, index - 1), l);
}

function distance(input: Oklch, l: number | null): number {
  return l === null ? Number.POSITIVE_INFINITY : Math.abs(l - input.l);
}

/**
 * The nearest lightness that passes every rule, keeping the input's hue and chroma (chroma
 * lowered only where sRGB requires). Darker and lighter are searched together, step by step,
 * so the first step that passes holds the nearest colour (darker on a tie); null when no
 * lightness passes.
 */
function nearestPassing(ctx: ThemeContext, input: Oklch): NearestPassing | null {
  for (let index = 1; index <= SEARCH_STEPS; index += 1) {
    const darker = passingAt(ctx, input, -1, index);
    const lighter = passingAt(ctx, input, 1, index);
    const best = distance(input, darker) <= distance(input, lighter) ? darker : lighter;
    if (best !== null) {
      return { l: best, hex: formatHex(oklchToRgb8({ l: best, c: input.c, h: input.h })) };
    }
  }
  return null;
}

/**
 * Checks an accent for one theme and never throws on input: anything but an opaque `#rrggbb`
 * (either case) is `invalid`; a colour failing any rule is `rejected`, with every failure and
 * the nearest passing colour; otherwise it is `accepted`, with its family.
 */
export function checkAccent(ctx: ThemeContext, input: string): AccentCheck {
  const accent = parseHex(input);
  if (accent === null) return { status: 'invalid' };
  const failures = failuresOf(ctx, accent);
  if (failures.length > 0) {
    return { status: 'rejected', failures, nearest: nearestPassing(ctx, toOklch(accent)) };
  }
  return { status: 'accepted', family: deriveAccentFamily(ctx, accent) };
}
