import { describe, expect, it } from 'vitest';

import { parseHex, type Rgb8 } from './colour';
import { contrastRatio, floorRatio, meetsRatio, relativeLuminance } from './contrast';

function rgb(hex: string): Rgb8 {
  const parsed = parseHex(hex);
  if (parsed === null) throw new Error(`not an opaque #rrggbb: ${hex}`);
  return parsed;
}

// The neutrals and provisional accents of ADR 0019 and plan §4.
const INK = rgb('#121212');
const WASHI = rgb('#f4efe6');
const STONE = rgb('#5e5850');
const ASH = rgb('#9a938a');
const SHU = rgb('#a8322a');
const KIN = rgb('#b8a07a');
const BLACK = rgb('#000000');
const WHITE = rgb('#ffffff');

const PASSING: readonly (readonly [string, Rgb8, Rgb8, string])[] = [
  ['ink on washi', INK, WASHI, '16.36'],
  ['stone on washi', STONE, WASHI, '6.14'],
  ['ash on ink', ASH, INK, '6.17'],
  ['shu on washi', SHU, WASHI, '5.81'],
  ['kin on ink', KIN, INK, '7.45'],
];

const FAILING: readonly (readonly [string, Rgb8, Rgb8, string])[] = [
  ['shu on ink', SHU, INK, '2.81'],
  ['kin on washi', KIN, WASHI, '2.20'],
  ['stone on ink', STONE, INK, '2.67'],
  ['ash on washi', ASH, WASHI, '2.65'],
];

/** The largest double below a positive `value`. */
function justBelow(value: number): number {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  view.setBigUint64(0, view.getBigUint64(0) - 1n);
  return view.getFloat64(0);
}

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance(BLACK)).toBe(0);
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 12);
  });

  it('weights green most and blue least', () => {
    const red = relativeLuminance(rgb('#ff0000'));
    const green = relativeLuminance(rgb('#00ff00'));
    const blue = relativeLuminance(rgb('#0000ff'));
    expect(red).toBeCloseTo(0.2126, 12);
    expect(green).toBeCloseTo(0.7152, 12);
    expect(blue).toBeCloseTo(0.0722, 12);
  });
});

describe('contrastRatio', () => {
  it.each([...PASSING, ...FAILING])('reproduces %s to two decimals', (_label, a, b, expected) => {
    expect(contrastRatio(a, b).toFixed(2)).toBe(expected);
  });

  it.each(PASSING)('%s passes 4.5:1', (_label, a, b) => {
    expect(meetsRatio(contrastRatio(a, b), 4.5)).toBe(true);
  });

  it.each(FAILING)('%s fails 3:1', (_label, a, b) => {
    expect(meetsRatio(contrastRatio(a, b), 3)).toBe(false);
  });

  it('is 21 for black on white', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 12);
  });

  it.each([INK, WASHI, SHU, KIN, BLACK, WHITE])('is 1 for a colour on itself', (colour) => {
    expect(contrastRatio(colour, colour)).toBe(1);
  });

  it.each([...PASSING, ...FAILING])('is symmetric for %s', (_label, a, b) => {
    expect(contrastRatio(b, a)).toBe(contrastRatio(a, b));
  });

  it('is never below 1', () => {
    expect(contrastRatio(SHU, KIN)).toBeGreaterThanOrEqual(1);
    expect(contrastRatio(KIN, SHU)).toBeGreaterThanOrEqual(1);
  });
});

describe('floorRatio', () => {
  it.each([
    [2.996, 2.99],
    [6.136, 6.13],
    [4.4999, 4.49],
    [4.5, 4.5],
    [21, 21],
    [1, 1],
  ])('reads %s as %s', (ratio, expected) => {
    expect(floorRatio(ratio)).toBe(expected);
  });

  it('never reads a ratio just below a threshold as the threshold', () => {
    expect(justBelow(4.5)).toBeLessThan(4.5);
    expect(justBelow(3)).toBeLessThan(3);
    expect(floorRatio(justBelow(4.5))).toBe(4.49);
    expect(floorRatio(justBelow(3))).toBe(2.99);
  });

  it('rounds the measured pairs down, not to nearest', () => {
    expect(floorRatio(contrastRatio(STONE, WASHI))).toBe(6.13);
    expect(floorRatio(contrastRatio(KIN, WASHI))).toBe(2.19);
  });
});

describe('meetsRatio', () => {
  it('compares the unrounded ratio', () => {
    expect(meetsRatio(4.4999, 4.5)).toBe(false);
    expect(meetsRatio(4.5, 4.5)).toBe(true);
    expect(meetsRatio(4.5000001, 4.5)).toBe(true);
    expect(meetsRatio(2.996, 3)).toBe(false);
  });

  it('fails the largest ratio below the threshold', () => {
    expect(meetsRatio(justBelow(4.5), 4.5)).toBe(false);
    expect(meetsRatio(justBelow(3), 3)).toBe(false);
  });
});
