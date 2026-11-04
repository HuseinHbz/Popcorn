import { describe, expect, it } from 'vitest';

import { formatToman, irrToToman } from './money';

describe('irrToToman', () => {
  it('divides by 10, rounding half away from zero', () => {
    expect(irrToToman(1_250_000n)).toBe(125_000n);
    expect(irrToToman(14n)).toBe(1n);
    expect(irrToToman(15n)).toBe(2n);
    expect(irrToToman(-14n)).toBe(-1n);
    expect(irrToToman(-15n)).toBe(-2n);
    expect(irrToToman(0n)).toBe(0n);
  });

  it('is exact for amounts beyond Number.MAX_SAFE_INTEGER', () => {
    expect(irrToToman(90_071_992_547_409_930n)).toBe(9_007_199_254_740_993n);
  });
});

describe('formatToman', () => {
  it('groups Toman with Persian digits by default', () => {
    expect(formatToman(1_250_000n)).toBe('۱۲۵٬۰۰۰');
  });

  it('groups Toman with Latin digits in English', () => {
    expect(formatToman(1_250_000n, 'en')).toBe('125,000');
  });

  it('formats amounts beyond Number.MAX_SAFE_INTEGER exactly, in both locales', () => {
    // 2^53 + 1 Toman: a float would print …992.
    expect(formatToman(90_071_992_547_409_930n, 'en')).toBe('9,007,199,254,740,993');
    expect(formatToman(90_071_992_547_409_930n)).toBe('۹٬۰۰۷٬۱۹۹٬۲۵۴٬۷۴۰٬۹۹۳');
  });

  it('formats negative amounts (refunds)', () => {
    expect(formatToman(-1_250_000n, 'en')).toBe('-125,000');
    expect(formatToman(-1_250_000n)).toContain('۱۲۵٬۰۰۰');
  });
});
