import { describe, expect, it } from 'vitest';

import { expiredRisks } from '../scripts/check-risk-register';

const register = [
  '| ID | Advisory | Review by |',
  '| --- | --- | --- |',
  '| R-001 | GHSA-aaaa | 2027-01-31 |',
  '| R-002 | GHSA-bbbb | 2026-10-01 |',
  '| R-003 | GHSA-cccc | soon |',
].join('\n');

describe('expiredRisks', () => {
  it('reports rows past their review date and rows without a valid date', () => {
    expect(expiredRisks(register, '2026-10-27')).toEqual([
      { id: 'R-002', reviewBy: '2026-10-01' },
      { id: 'R-003', reviewBy: 'soon' },
    ]);
  });

  it('accepts a review date of today', () => {
    expect(expiredRisks('| R-001 | x | 2026-10-27 |', '2026-10-27')).toEqual([]);
  });
});
