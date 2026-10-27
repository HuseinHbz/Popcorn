import { describe, expect, it } from 'vitest';

import { lighthouseTable } from '../scripts/lighthouse-summary';

const run = (url: string, performance: number) => ({
  url,
  summary: { performance, accessibility: 1, 'best-practices': 1, seo: 1 },
});

describe('lighthouseTable', () => {
  it('shows the median and range across runs for each URL', () => {
    const table = lighthouseTable([
      run('http://localhost:3100/fa', 0.95),
      run('http://localhost:3100/fa', 0.99),
      run('http://localhost:3100/fa', 0.97),
      run('http://localhost:3100/en', 0.98),
    ]);
    expect(table).toContain('| /fa | 3 | 97 (95–99) | 100 | 100 | 100 |');
    expect(table).toContain('| /en | 1 | 98 | 100 | 100 | 100 |');
  });

  it('averages the two middle runs for an even number of runs', () => {
    const table = lighthouseTable([run('http://x/fa', 0.9), run('http://x/fa', 0.96)]);
    expect(table).toContain('| /fa | 2 | 93 (90–96) |');
  });
});
