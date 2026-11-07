import { describe, expect, it } from 'vitest';

import { deriveAccentColours, deriveAccentFamily, THEMES, type ThemeContext } from './accent';
import { formatHex, parseHex, type Rgb8 } from './colour';
import { contrastRatio } from './contrast';
import { oklchToRgb8, toOklch } from './oklch';

/** Story AC10: the accent family, derived in OKLCH from one accent per theme. */
function rgb(hex: string): Rgb8 {
  const parsed = parseHex(hex);
  if (parsed === null) throw new Error(`not an opaque #rrggbb: ${hex}`);
  return parsed;
}

// The neutrals of plan §4 and the provisional steps of the story's Terms; from 1.1c both come
// from tokens.json.
const STEPS = { hover: 0.06, pressed: 0.12, subtleMaxChroma: 0.03 };
const CONTEXTS: Record<'light' | 'dark', ThemeContext> = {
  light: {
    theme: 'light',
    background: rgb('#f4efe6'),
    text: rgb('#121212'),
    mutedText: rgb('#5e5850'),
    steps: { ...STEPS, subtle: 0.04 },
  },
  dark: {
    theme: 'dark',
    background: rgb('#121212'),
    text: rgb('#f4efe6'),
    mutedText: rgb('#9a938a'),
    steps: { ...STEPS, subtle: 0.06 },
  },
};
const AWAY = { light: -1, dark: 1 } as const;
const SHU = rgb('#a8322a');
const KIN = rgb('#b8a07a');

/** The 4,096 colours whose channels are multiples of 17 (0, 17, …, 255). */
function steppedColours(): Rgb8[] {
  const values = Array.from({ length: 16 }, (_, step) => step * 17);
  return values.flatMap((r) => values.flatMap((g) => values.map((b) => ({ r, g, b }))));
}

describe('deriveAccentFamily', () => {
  it('derives the default families: shu on the light theme, kin on the dark theme', () => {
    expect(deriveAccentFamily(CONTEXTS.light, SHU)).toEqual({
      accent: '#a8322a',
      hover: '#941c18',
      pressed: '#7f0005',
      subtle: '#f6dbd7',
      onAccent: '#f4efe6',
    });
    expect(deriveAccentFamily(CONTEXTS.dark, KIN)).toEqual({
      accent: '#b8a07a',
      hover: '#cbb38c',
      pressed: '#dfc69f',
      subtle: '#271e0f',
      onAccent: '#121212',
    });
  });

  it('puts washi on shu (5.81:1) and ink on kin (7.45:1)', () => {
    const shu = deriveAccentColours(CONTEXTS.light, SHU);
    const kin = deriveAccentColours(CONTEXTS.dark, KIN);
    expect(formatHex(shu.onAccent)).toBe('#f4efe6');
    expect(contrastRatio(shu.onAccent, shu.accent)).toBeCloseTo(5.81, 2);
    expect(formatHex(kin.onAccent)).toBe('#121212');
    expect(contrastRatio(kin.onAccent, kin.accent)).toBeCloseTo(7.45, 2);
  });

  it('formats every colour as lowercase #rrggbb, the same every time', () => {
    for (const theme of THEMES) {
      const family = deriveAccentFamily(CONTEXTS[theme], SHU);
      for (const value of Object.values(family)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
      expect(deriveAccentFamily(CONTEXTS[theme], SHU)).toEqual(family);
    }
  });
});

describe('deriveAccentColours', () => {
  it.each(THEMES)(
    'shifts hover and pressed away from the %s background, keeping hue and chroma',
    (theme) => {
      const ctx = CONTEXTS[theme];
      for (const accent of steppedColours()) {
        const { l, c, h } = toOklch(accent);
        const colours = deriveAccentColours(ctx, accent);
        expect(colours.hover).toEqual(oklchToRgb8({ l: l + AWAY[theme] * 0.06, c, h }));
        expect(colours.pressed).toEqual(oklchToRgb8({ l: l + AWAY[theme] * 0.12, c, h }));
      }
    },
  );

  it('moves the defaults by 0.06 and 0.12 in lightness with their hue within one degree', () => {
    for (const [theme, accent] of [
      ['light', SHU],
      ['dark', KIN],
    ] as const) {
      const base = toOklch(accent);
      const colours = deriveAccentColours(CONTEXTS[theme], accent);
      for (const [key, step] of [
        ['hover', 0.06],
        ['pressed', 0.12],
      ] as const) {
        const shifted = toOklch(colours[key]);
        expect(Math.abs(shifted.l - (base.l + AWAY[theme] * step))).toBeLessThan(0.002);
        expect(Math.abs(shifted.h - base.h)).toBeLessThan(1);
      }
    }
  });

  it.each(THEMES)('derives subtle from the %s background with at most 0.03 chroma', (theme) => {
    const ctx = CONTEXTS[theme];
    const background = toOklch(ctx.background);
    for (const accent of steppedColours()) {
      const { c, h } = toOklch(accent);
      const { subtle } = deriveAccentColours(ctx, accent);
      const expected = {
        l: background.l + AWAY[theme] * ctx.steps.subtle,
        c: Math.min(c, 0.03),
        h,
      };
      expect(subtle).toEqual(oklchToRgb8(expected));
      // 8-bit rounding can add a little chroma to the capped value.
      expect(toOklch(subtle).c).toBeLessThan(0.033);
    }
  });

  it('keeps an achromatic accent achromatic', () => {
    for (const theme of THEMES) {
      for (let value = 0; value <= 255; value += 17) {
        const colours = deriveAccentColours(CONTEXTS[theme], { r: value, g: value, b: value });
        for (const { r, g, b } of [colours.hover, colours.pressed, colours.subtle]) {
          expect([g, b]).toEqual([r, r]);
        }
      }
    }
  });

  it.each(THEMES)('chooses whichever of ink and washi contrasts more, on %s', (theme) => {
    const ctx = CONTEXTS[theme];
    for (const accent of steppedColours()) {
      const { onAccent } = deriveAccentColours(ctx, accent);
      const other = onAccent === ctx.text ? ctx.background : ctx.text;
      expect([ctx.text, ctx.background]).toContain(onAccent);
      expect(contrastRatio(onAccent, accent)).toBeGreaterThanOrEqual(contrastRatio(other, accent));
    }
  });

  it('stops at black and white instead of leaving 0–1', () => {
    const black = deriveAccentColours(CONTEXTS.light, rgb('#000000'));
    expect([formatHex(black.hover), formatHex(black.pressed)]).toEqual(['#000000', '#000000']);
    const white = deriveAccentColours(CONTEXTS.dark, rgb('#ffffff'));
    expect([formatHex(white.hover), formatHex(white.pressed)]).toEqual(['#ffffff', '#ffffff']);
  });
});
