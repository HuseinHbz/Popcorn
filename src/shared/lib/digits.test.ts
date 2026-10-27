import { describe, expect, it } from 'vitest';

import { toPersianDigits } from './digits';

describe('toPersianDigits', () => {
  it('converts Latin digits in strings, numbers and bigints', () => {
    expect(toPersianDigits('میز 12، ساعت 20:30')).toBe('میز ۱۲، ساعت ۲۰:۳۰');
    expect(toPersianDigits(1405)).toBe('۱۴۰۵');
    expect(toPersianDigits(9876543210n)).toBe('۹۸۷۶۵۴۳۲۱۰');
  });

  it('normalises Arabic-Indic digits to Persian ones', () => {
    expect(toPersianDigits('٠١٢٣٤٥٦٧٨٩')).toBe('۰۱۲۳۴۵۶۷۸۹');
  });

  it('leaves text without digits unchanged', () => {
    expect(toPersianDigits('ناکایا')).toBe('ناکایا');
  });
});
