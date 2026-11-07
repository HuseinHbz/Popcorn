import { describe, expect, it } from 'vitest';

import { type AccentFamily, deriveAccentFamily, THEMES, type ThemeContext } from './accent';
import { ACCENT_RULES, type AccentCheck, checkAccent, REQUIRED_RATIO } from './check';
import { formatHex, parseHex, type Rgb8 } from './colour';
import { contrastRatio } from './contrast';
import { oklchToRgb8, toOklch } from './oklch';

/** Story AC11–AC14: the accent check the stylesheet and the PR 3.6 save both run. */
function rgb(hex: string): Rgb8 {
  const parsed = parseHex(hex);
  if (parsed === null) throw new Error(`not an opaque #rrggbb: ${hex}`);
  return parsed;
}

// The neutrals of plan §4 and the provisional steps of the story's Terms (tokens.json from 1.1c).
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

function rejected(result: AccentCheck): Extract<AccentCheck, { status: 'rejected' }> {
  if (result.status !== 'rejected') throw new Error(`expected rejected, got ${result.status}`);
  return result;
}

describe('checkAccent input (AC11)', () => {
  it.each([
    'red',
    '#fff',
    '#a8322a80',
    '#a8322a;}',
    '#a8322a;}body{display:none}',
    '',
    ' #a8322a',
    '#a8322a\n',
    '#gggggg',
    'a8322a',
    '#ａ8322a',
  ])('returns invalid for %j', (input) => {
    expect(checkAccent(CONTEXTS.light, input)).toEqual({ status: 'invalid' });
  });

  it('never throws, whatever the string', () => {
    const inputs = [
      'x'.repeat(100_000),
      ...Array.from({ length: 2048 }, (_, code) => `#a8322${String.fromCodePoint(code)}`),
    ];
    for (const input of inputs) {
      for (const theme of THEMES) expect(() => checkAccent(CONTEXTS[theme], input)).not.toThrow();
    }
  });

  it('accepts either case and returns the family in lowercase', () => {
    expect(checkAccent(CONTEXTS.light, '#A8322A')).toEqual({
      status: 'accepted',
      family: deriveAccentFamily(CONTEXTS.light, rgb('#a8322a')),
    });
  });
});

describe('checkAccent rules (AC11)', () => {
  it('accepts the default accents', () => {
    expect(checkAccent(CONTEXTS.light, '#a8322a').status).toBe('accepted');
    expect(checkAccent(CONTEXTS.dark, '#b8a07a').status).toBe('accepted');
  });

  it('reports each failing rule with its measured and required ratio', () => {
    const shuOnDark = rejected(checkAccent(CONTEXTS.dark, '#a8322a'));
    expect(shuOnDark.failures).toEqual([
      { rule: 'accent', measured: 2.81, required: 4.5 },
      { rule: 'hover', measured: 3.66, required: 4.5 },
      { rule: 'on-hover', measured: 4.46, required: 4.5 },
      { rule: 'on-pressed', measured: 3.51, required: 4.5 },
    ]);
    const kinOnLight = rejected(checkAccent(CONTEXTS.light, '#b8a07a'));
    expect(kinOnLight.failures).toEqual([
      { rule: 'accent', measured: 2.19, required: 4.5 },
      { rule: 'hover', measured: 2.74, required: 4.5 },
      { rule: 'pressed', measured: 3.48, required: 4.5 },
    ]);
  });

  it('fails on-accent when neither ink nor washi reaches 4.5:1 on the accent', () => {
    const grey = rgb('#777777');
    expect(contrastRatio(rgb('#121212'), grey)).toBeLessThan(4.5);
    expect(contrastRatio(rgb('#f4efe6'), grey)).toBeLessThan(4.5);
    const rules = rejected(checkAccent(CONTEXTS.light, '#777777')).failures.map((f) => f.rule);
    expect(rules).toContain('on-accent');
  });

  // With the token neutrals both rules always pass (at least 5.3:1), so a context makes one fail.
  it.each([
    ['text', 'text-on-subtle'],
    ['mutedText', 'muted-on-subtle'],
  ] as const)('checks %s on subtle, which no lightness can fix', (key, rule) => {
    const unreadable = { ...CONTEXTS.light, [key]: rgb('#e8e3da') };
    const result = rejected(checkAccent(unreadable, '#a8322a'));
    expect(result.failures.map((f) => f.rule)).toEqual([rule]);
    expect(result.nearest).toBeNull();
  });
});

describe('rounding (AC12)', () => {
  it.each([
    ['light', '#4a7572'],
    ['dark', '#07902f'],
  ] as const)('rejects a ratio in [4.495, 4.5) on %s and reports it as 4.49', (theme, hex) => {
    const ratio = contrastRatio(rgb(hex), CONTEXTS[theme].background);
    expect(ratio).toBeGreaterThanOrEqual(4.495);
    expect(ratio).toBeLessThan(4.5);
    const failure = rejected(checkAccent(CONTEXTS[theme], hex)).failures[0];
    expect(failure).toEqual({ rule: 'accent', measured: 4.49, required: 4.5 });
  });
});

describe('nearest passing colour (AC13)', () => {
  it.each([
    ['shu on the dark theme', 'dark', '#a8322a', 2.81, 1],
    ['kin on the light theme', 'light', '#b8a07a', 2.2, -1],
    ['a 4.0:1 accent on washi', 'light', '#837451', 4.0, -1],
  ] as const)('finds it for %s', (_name, theme, hex, ratio, direction) => {
    const ctx = CONTEXTS[theme];
    expect(contrastRatio(rgb(hex), ctx.background)).toBeCloseTo(ratio, 2);
    const input = toOklch(rgb(hex));
    const { nearest } = rejected(checkAccent(ctx, hex));
    if (nearest === null) throw new Error('expected a nearest passing colour');
    // Lighter on the dark theme, darker on the light theme: both directions are searched.
    expect(Math.sign(nearest.l - input.l)).toBe(direction);
    // Same hue and chroma, lowered only where sRGB requires.
    expect(nearest.hex).toBe(formatHex(oklchToRgb8({ l: nearest.l, c: input.c, h: input.h })));
    expect(checkAccent(ctx, nearest.hex).status).toBe('accepted');
    // 0.01 back toward the input fails (AC13); so does 0.002, which a search that stopped at
    // its 0.01 grid without refining would still pass.
    for (const back of [0.01, 0.002]) {
      const moved = oklchToRgb8({ l: nearest.l - direction * back, c: input.c, h: input.h });
      expect(checkAccent(ctx, formatHex(moved)).status).toBe('rejected');
    }
  });
});

/** The pairs AC11 names, written out here from the rendered hex rather than taken from the check. */
function pairsPass(ctx: ThemeContext, family: AccentFamily): boolean {
  const accent = rgb(family.accent);
  const hover = rgb(family.hover);
  const pressed = rgb(family.pressed);
  const subtle = rgb(family.subtle);
  const on = rgb(family.onAccent);
  const pairs: [Rgb8, Rgb8][] = [
    [accent, ctx.background],
    [hover, ctx.background],
    [pressed, ctx.background],
    [on, accent],
    [on, hover],
    [on, pressed],
    [ctx.text, subtle],
    [ctx.mutedText, subtle],
  ];
  expect(pairs).toHaveLength(ACCENT_RULES.length);
  return pairs.every(([a, b]) => contrastRatio(a, b) >= REQUIRED_RATIO);
}

describe('property (AC14)', () => {
  it.each(THEMES)(
    'for each of the 4,096 stepped colours on %s, passes what it accepts and repairs what it rejects',
    (theme) => {
      const ctx = CONTEXTS[theme];
      const counts = { accepted: 0, rejected: 0 };
      const values = Array.from({ length: 16 }, (_, step) => step * 17);
      for (const r of values) {
        for (const g of values) {
          for (const b of values) {
            const result = checkAccent(ctx, formatHex({ r, g, b }));
            if (result.status === 'accepted') {
              counts.accepted += 1;
              expect(pairsPass(ctx, result.family)).toBe(true);
            } else {
              counts.rejected += 1;
              const { nearest, failures } = rejected(result);
              expect(failures.every((f) => f.measured < f.required)).toBe(true);
              expect(nearest && checkAccent(ctx, nearest.hex).status).toBe('accepted');
            }
          }
        }
      }
      expect(counts.accepted).toBeGreaterThan(0);
      expect(counts.rejected).toBeGreaterThan(0);
    },
    30_000,
  );
});
