import { describe, expect, it } from 'vitest';

import {
  lighthouseNotices,
  lighthouseSummary,
  lighthouseTable,
} from '../scripts/lighthouse-summary';

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

describe('lighthouseNotices', () => {
  it('writes one notice per page, which the checks API serves as an annotation', () => {
    const notices = lighthouseNotices([
      run('http://localhost:3100/fa', 0.95),
      run('http://localhost:3100/fa', 0.99),
      run('http://localhost:3100/fa', 0.97),
      run('http://localhost:3100/en', 0.98),
    ]);
    expect(notices.split('\n')).toEqual([
      '::notice title=Lighthouse /fa (3 runs)::performance 97 (95–99), accessibility 100, best-practices 100, seo 100',
      '::notice title=Lighthouse /en (1 runs)::performance 98, accessibility 100, best-practices 100, seo 100',
    ]);
  });
});

describe('lighthouseSummary', () => {
  it('says there are no results when Lighthouse CI wrote no manifest', () => {
    expect(lighthouseSummary(undefined, false)).toContain('No results: Lighthouse CI stopped');
    expect(lighthouseSummary(undefined, true)).toMatch(/^::error title=Lighthouse::No results/);
  });

  it('prints the table or the notices when there is a manifest', () => {
    const manifest = [run('http://x/fa', 0.97)];
    expect(lighthouseSummary(manifest, false)).toBe(lighthouseTable(manifest));
    expect(lighthouseSummary(manifest, true)).toBe(lighthouseNotices(manifest));
  });
});
