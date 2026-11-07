import { formatHex, type Rgb8 } from './colour';
import { contrastRatio } from './contrast';
import { oklchToRgb8, toOklch } from './oklch';

export type Theme = 'light' | 'dark';

/** The two themes, in the order the stylesheet declares them. */
export const THEMES = ['light', 'dark'] as const satisfies readonly Theme[];

/**
 * How far each derived colour moves in OKLCH lightness. hover and pressed move away from the
 * theme background; subtle starts at the background and moves the same way, by `subtle`, with
 * at most `subtleMaxChroma` of the accent's chroma. The values are provisional tokens.
 */
export type AccentSteps = {
  readonly hover: number;
  readonly pressed: number;
  readonly subtle: number;
  readonly subtleMaxChroma: number;
};

/**
 * What one theme needs to derive and check an accent. The colours come from tokens.json, so no
 * token value is written here: the background (washi on light, ink on dark), the primary and
 * secondary text, and the derivation steps.
 */
export type ThemeContext = {
  readonly theme: Theme;
  readonly background: Rgb8;
  readonly text: Rgb8;
  readonly mutedText: Rgb8;
  readonly steps: AccentSteps;
};

/** The accent family as 8-bit colours: what the check measures is what the page renders. */
export type AccentColours = {
  readonly accent: Rgb8;
  readonly hover: Rgb8;
  readonly pressed: Rgb8;
  readonly subtle: Rgb8;
  readonly onAccent: Rgb8;
};

/** The accent family as lowercase `#rrggbb`, ready for the CSS variables of the same names. */
export type AccentFamily = { readonly [Key in keyof AccentColours]: string };

/** -1 on the light theme (darker), +1 on the dark theme (lighter): away from the background. */
function awayFromBackground(theme: Theme): number {
  return theme === 'light' ? -1 : 1;
}

/**
 * Derives the accent family in OKLCH, keeping the accent's hue: hover and pressed shift its
 * lightness away from the background (chroma lowered only where sRGB requires); subtle is the
 * background shifted the same way, with the accent's hue and a capped chroma. On-accent is
 * whichever of the theme's text and background (ink and washi) contrasts more with the accent;
 * a tie goes to the background. An achromatic accent gives achromatic colours.
 */
export function deriveAccentColours(ctx: ThemeContext, accent: Rgb8): AccentColours {
  const away = awayFromBackground(ctx.theme);
  const { l, c, h } = toOklch(accent);
  const shifted = (step: number): Rgb8 => oklchToRgb8({ l: l + away * step, c, h });
  const background = toOklch(ctx.background);
  const subtle = oklchToRgb8({
    l: background.l + away * ctx.steps.subtle,
    c: Math.min(c, ctx.steps.subtleMaxChroma),
    h,
  });
  const onText = contrastRatio(ctx.text, accent) > contrastRatio(ctx.background, accent);
  return {
    accent,
    hover: shifted(ctx.steps.hover),
    pressed: shifted(ctx.steps.pressed),
    subtle,
    onAccent: onText ? ctx.text : ctx.background,
  };
}

/** `deriveAccentColours` formatted as `#rrggbb`; the same input always gives the same output. */
export function deriveAccentFamily(ctx: ThemeContext, accent: Rgb8): AccentFamily {
  const colours = deriveAccentColours(ctx, accent);
  return {
    accent: formatHex(colours.accent),
    hover: formatHex(colours.hover),
    pressed: formatHex(colours.pressed),
    subtle: formatHex(colours.subtle),
    onAccent: formatHex(colours.onAccent),
  };
}
