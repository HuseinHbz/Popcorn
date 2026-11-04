import { describe, expect, it } from 'vitest';

import { formatJalali } from './date';

// 2026-10-27 00:00 in Tehran (UTC+03:30) is 20:30 UTC the previous day.
const tehranMidnight = new Date('2026-10-26T20:30:00Z');
const justBefore = new Date('2026-10-26T20:29:59Z');

describe('formatJalali', () => {
  it('formats in the Persian calendar, in Tehran time, with Persian digits by default', () => {
    expect(formatJalali(tehranMidnight)).toBe('۵ آبان ۱۴۰۵');
    expect(formatJalali(justBefore)).toBe('۴ آبان ۱۴۰۵');
  });

  it('supports the short and date-time styles', () => {
    expect(formatJalali(tehranMidnight, 'fa', 'short')).toBe('۱۴۰۵/۸/۵');
    expect(formatJalali(justBefore, 'fa', 'dateTime')).toBe('۴ آبان ۱۴۰۵، ۲۳:۵۹');
  });

  it('formats in English with Latin digits', () => {
    expect(formatJalali(tehranMidnight, 'en')).toBe('Aban 5, 1405 AP');
    expect(formatJalali(justBefore, 'en', 'dateTime')).toBe('Aban 4, 1405 AP, 11:59 PM');
  });

  it('rejects an invalid date', () => {
    expect(() => formatJalali(new Date('not a date'))).toThrow(RangeError);
  });
});
