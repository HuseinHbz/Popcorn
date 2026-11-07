import { describe, expect, it } from 'vitest';

import { formatHex, parseHex, type Rgb8 } from './colour';
import {
  GAMUT_EPSILON,
  gamutMap,
  inGamut,
  linearToOklab,
  normaliseHue,
  oklabToLinear,
  oklchToLinear,
  oklchToRgb8,
  toOklch,
} from './oklch';

function rgb(hex: string): Rgb8 {
  const parsed = parseHex(hex);
  if (parsed === null) throw new Error(`not an opaque #rrggbb: ${hex}`);
  return parsed;
}

function expectNear(actual: number, expected: number, tolerance = 1e-3): void {
  expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
}

/** The 4,096 colours whose channels are multiples of 17 (0, 17, …, 255), as lowercase hex. */
function steppedColours(): string[] {
  const digits = Array.from({ length: 16 }, (_, digit) => digit.toString(16));
  return digits.flatMap((r) =>
    digits.flatMap((g) => digits.map((b) => `#${r}${r}${g}${g}${b}${b}`)),
  );
}

describe('toOklch', () => {
  it('puts white at l 1 with no chroma', () => {
    const white = toOklch(rgb('#ffffff'));
    expectNear(white.l, 1, 1e-6);
    expect(white.c).toBeLessThan(1e-6);
  });

  it('puts black at the origin', () => {
    expect(toOklch(rgb('#000000'))).toEqual({ l: 0, c: 0, h: 0 });
  });

  it('matches the published reference for sRGB red', () => {
    const red = toOklch(rgb('#ff0000'));
    expectNear(red.l, 0.628);
    expectNear(red.c, 0.2577);
    expectNear(red.h, 29.234);
  });

  it('normalises a negative atan2 hue into 0–360', () => {
    // Blue has a negative b axis: atan2 gives about -95.95 degrees.
    const blue = toOklch(rgb('#0000ff'));
    expectNear(blue.h, 264.052);
    expectNear(blue.l, 0.452);
    expectNear(blue.c, 0.3132);
  });

  it('keeps every stepped colour within range', () => {
    const outOfRange = steppedColours().filter((hex) => {
      const { l, c, h } = toOklch(rgb(hex));
      return l < 0 || l > 1 + 1e-9 || c < 0 || h < 0 || h >= 360;
    });
    expect(outOfRange).toEqual([]);
  });
});

describe('normaliseHue', () => {
  it('leaves a hue in 0–360 unchanged', () => {
    expect(normaliseHue(0)).toBe(0);
    expect(normaliseHue(29.5)).toBe(29.5);
    expect(normaliseHue(359.5)).toBe(359.5);
  });

  it('wraps negative and full-turn hues', () => {
    expect(normaliseHue(-90)).toBe(270);
    expect(normaliseHue(-725)).toBe(355);
    expect(normaliseHue(360)).toBe(0);
    expect(normaliseHue(725)).toBe(5);
  });

  it('never returns 360 for a tiny negative hue', () => {
    // -1e-15 + 360 rounds to 360 in floating point; the result must still be below 360.
    expect(normaliseHue(-1e-15)).toBe(0);
  });

  it('turns negative zero into zero', () => {
    expect(Object.is(normaliseHue(-0), 0)).toBe(true);
  });
});

describe('linearToOklab and oklabToLinear', () => {
  it('map linear white to l 1 on the neutral axis', () => {
    const white = linearToOklab({ r: 1, g: 1, b: 1 });
    expectNear(white.l, 1, 1e-6);
    expectNear(white.a, 0, 1e-6);
    expectNear(white.b, 0, 1e-6);
  });

  it('are inverse to within the drift of the published matrices', () => {
    // The published 10-digit matrices invert each other only to about 6e-8.
    const linear = { r: 0.2, g: 0.5, b: 0.9 };
    const back = oklabToLinear(linearToOklab(linear));
    expectNear(back.r, linear.r, GAMUT_EPSILON);
    expectNear(back.g, linear.g, GAMUT_EPSILON);
    expectNear(back.b, linear.b, GAMUT_EPSILON);
  });
});

describe('oklchToLinear', () => {
  it('inverts toOklch', () => {
    const red = oklchToLinear(toOklch(rgb('#ff0000')));
    expectNear(red.r, 1, 1e-6);
    expectNear(red.g, 0, 1e-6);
    expectNear(red.b, 0, 1e-6);
  });

  it.each([
    ['zero chroma', { l: 0.5, c: 0, h: 0 }],
    ['chroma just below 1e-6', { l: 0.37, c: 9.99e-7, h: 77 }],
    ['negative chroma', { l: 0.8, c: -0.2, h: 200 }],
  ])('gives exactly equal channels for %s', (_label, lch) => {
    const { r, g, b } = oklchToLinear(lch);
    expect(r).toBe(lch.l ** 3);
    expect(g).toBe(r);
    expect(b).toBe(r);
  });

  it('does not clamp lightness', () => {
    expect(inGamut(oklchToLinear({ l: 1.2, c: 0, h: 0 }), GAMUT_EPSILON)).toBe(false);
  });
});

describe('inGamut', () => {
  it('accepts channels in 0–1', () => {
    expect(inGamut({ r: 0, g: 0.5, b: 1 }, 0)).toBe(true);
  });

  it('allows the given tolerance on either side, and no more', () => {
    expect(inGamut({ r: -1e-9, g: 0.5, b: 1 }, 0)).toBe(false);
    expect(inGamut({ r: -1e-9, g: 0.5, b: 1 }, 1e-7)).toBe(true);
    expect(inGamut({ r: 0, g: 1 + 2e-7, b: 0 }, 1e-7)).toBe(false);
    expect(inGamut({ r: 0, g: 0, b: -0.1 }, 1e-7)).toBe(false);
  });

  it('rejects NaN', () => {
    expect(inGamut({ r: Number.NaN, g: 0, b: 0 }, 1)).toBe(false);
  });
});

describe('gamutMap', () => {
  it('returns an in-gamut colour unchanged', () => {
    const red = toOklch(rgb('#ff0000'));
    expect(gamutMap(red)).toEqual(red);
  });

  it('lowers only chroma, to the edge of the gamut', () => {
    const wanted = { l: 0.7, c: 0.4, h: 140 };
    expect(inGamut(oklchToLinear(wanted), GAMUT_EPSILON)).toBe(false);
    const mapped = gamutMap(wanted);
    expect(mapped.l).toBe(0.7);
    expect(mapped.h).toBe(140);
    expect(mapped.c).toBeGreaterThan(0.1);
    expect(mapped.c).toBeLessThan(0.4);
    expect(inGamut(oklchToLinear(mapped), GAMUT_EPSILON)).toBe(true);
    expect(inGamut(oklchToLinear({ ...mapped, c: mapped.c + 1e-4 }), GAMUT_EPSILON)).toBe(false);
  });

  it('clamps lightness to 0–1', () => {
    const above = gamutMap({ l: 1.2, c: 0.1, h: 30 });
    expect(above.l).toBe(1);
    expect(inGamut(oklchToLinear(above), GAMUT_EPSILON)).toBe(true);
    const below = gamutMap({ l: -0.3, c: 0.1, h: 30 });
    expect(below.l).toBe(0);
    expect(inGamut(oklchToLinear(below), GAMUT_EPSILON)).toBe(true);
  });

  it('reads a negative chroma as 0', () => {
    expect(gamutMap({ l: 0.5, c: -0.1, h: 30 })).toEqual({ l: 0.5, c: 0, h: 30 });
  });

  it.each([Number.POSITIVE_INFINITY, Number.NaN])('falls back to grey for chroma %s', (c) => {
    expect(gamutMap({ l: 0.5, c, h: 30 })).toEqual({ l: 0.5, c: 0, h: 30 });
  });
});

describe('oklchToRgb8', () => {
  it('round-trips every colour whose channels are multiples of 17', () => {
    const colours = steppedColours();
    expect(colours).toHaveLength(4096);
    const failures = colours.filter((hex) => formatHex(oklchToRgb8(toOklch(rgb(hex)))) !== hex);
    expect(failures).toEqual([]);
  });

  it('gives equal channels for an achromatic colour', () => {
    for (let step = 0; step <= 100; step += 1) {
      const { r, g, b } = oklchToRgb8({ l: step / 100, c: 5e-7, h: (step * 37) % 360 });
      expect(g).toBe(r);
      expect(b).toBe(r);
    }
  });

  it('gamut-maps before rounding', () => {
    const wanted = { l: 0.7, c: 0.4, h: 140 };
    expect(oklchToRgb8(wanted)).toEqual(oklchToRgb8(gamutMap(wanted)));
  });

  it('clamps lightness to black and white', () => {
    expect(oklchToRgb8({ l: 1.5, c: 0, h: 0 })).toEqual({ r: 255, g: 255, b: 255 });
    expect(oklchToRgb8({ l: -0.5, c: 0, h: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  // A NaN lightness used to become black, which passes contrast on washi (issue #18).
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'throws for lightness %s instead of returning a colour',
    (l) => {
      expect(() => oklchToRgb8({ l, c: 0.1, h: 30 })).toThrow(RangeError);
      expect(() => gamutMap({ l, c: 0, h: 0 })).toThrow('OKLCH lightness must be a finite number');
    },
  );
});
