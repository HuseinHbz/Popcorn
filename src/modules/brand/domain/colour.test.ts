import { describe, expect, it } from 'vitest';

import { clampByte, formatHex, linearToSrgb, parseHex, srgbToLinear } from './colour';

describe('parseHex', () => {
  it('reads an opaque #rrggbb into 8-bit channels', () => {
    expect(parseHex('#a8322a')).toEqual({ r: 168, g: 50, b: 42 });
    expect(parseHex('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHex('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('accepts upper and mixed case', () => {
    expect(parseHex('#A8322A')).toEqual({ r: 168, g: 50, b: 42 });
    expect(parseHex('#b8A07a')).toEqual({ r: 184, g: 160, b: 122 });
  });

  it.each([
    ['a colour name', 'red'],
    ['shorthand', '#fff'],
    ['an alpha channel', '#a8322a80'],
    ['trailing CSS', '#a8322a;}'],
    ['the empty string', ''],
    ['a leading space', ' #a8322a'],
    ['a trailing space', '#a8322a '],
    ['a trailing newline', '#a8322a\n'],
    ['a non-hex digit', '#a8322g'],
    ['a missing hash', 'a8322a'],
    ['a 0x prefix', '0xa8322a'],
    ['Arabic-Indic digits', '#٠٠٠٠٠٠'],
    ['a signed channel', '#-a8322'],
  ])('rejects %s', (_label, input) => {
    expect(parseHex(input)).toBeNull();
  });
});

describe('clampByte', () => {
  it('rounds half up to an integer', () => {
    expect(clampByte(127.5)).toBe(128);
    expect(clampByte(127.49)).toBe(127);
  });

  it('clamps to 0–255', () => {
    expect(clampByte(300)).toBe(255);
    expect(clampByte(-5)).toBe(0);
    expect(clampByte(Number.POSITIVE_INFINITY)).toBe(255);
    expect(clampByte(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it('never returns negative zero', () => {
    expect(Object.is(clampByte(-0.0003), 0)).toBe(true);
  });

  it('reads NaN as 0, so the result is always a byte', () => {
    expect(clampByte(Number.NaN)).toBe(0);
  });
});

describe('formatHex', () => {
  it('writes lowercase #rrggbb with two digits per channel', () => {
    expect(formatHex({ r: 168, g: 50, b: 42 })).toBe('#a8322a');
    expect(formatHex({ r: 0, g: 10, b: 255 })).toBe('#000aff');
  });

  it('clamps and rounds out-of-range channels', () => {
    expect(formatHex({ r: 300, g: -5, b: 127.5 })).toBe('#ff0080');
    expect(formatHex({ r: Number.NaN, g: 0.4, b: 254.6 })).toBe('#0000ff');
  });

  it('round-trips with parseHex, normalising case', () => {
    const upper = parseHex('#A8322A');
    expect(upper).not.toBeNull();
    if (upper !== null) expect(formatHex(upper)).toBe('#a8322a');
    for (let value = 0; value <= 255; value += 1) {
      const hex = formatHex({ r: value, g: 255 - value, b: value });
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
      expect(parseHex(hex)).toEqual({ r: value, g: 255 - value, b: value });
    }
  });
});

describe('srgbToLinear and linearToSrgb', () => {
  it('fix black and white', () => {
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(1)).toBeCloseTo(1, 12);
    expect(linearToSrgb(0)).toBe(0);
    expect(linearToSrgb(1)).toBeCloseTo(1, 12);
  });

  it('use the linear segment at and below the thresholds', () => {
    expect(srgbToLinear(0.04045)).toBe(0.04045 / 12.92);
    expect(srgbToLinear(0.02)).toBe(0.02 / 12.92);
    expect(linearToSrgb(0.0031308)).toBe(0.0031308 * 12.92);
    expect(linearToSrgb(0.001)).toBe(0.001 * 12.92);
  });

  it('use the power curve above the thresholds', () => {
    expect(srgbToLinear(0.5)).toBeCloseTo(0.214041, 6);
    expect(linearToSrgb(0.214041)).toBeCloseTo(0.5, 6);
  });

  it('meet at the thresholds to within the rounding of the standard', () => {
    // The published constants leave a jump of about 3e-8, far below an 8-bit step.
    expect(srgbToLinear(0.04045 + 1e-12)).toBeCloseTo(srgbToLinear(0.04045), 7);
    expect(linearToSrgb(0.0031308 + 1e-12)).toBeCloseTo(linearToSrgb(0.0031308), 7);
  });

  it('extend linearly below zero instead of returning NaN', () => {
    expect(srgbToLinear(-0.1)).toBe(-0.1 / 12.92);
    expect(linearToSrgb(-0.01)).toBe(-0.01 * 12.92);
  });

  it('are inverse for every 8-bit channel', () => {
    for (let value = 0; value <= 255; value += 1) {
      expect(Math.round(linearToSrgb(srgbToLinear(value / 255)) * 255)).toBe(value);
    }
  });
});
