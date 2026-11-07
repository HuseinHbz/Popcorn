import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  lighthouseNotices,
  lighthouseSummary,
  lighthouseTable,
  type Metrics,
  reportMetrics,
} from '../scripts/lighthouse-summary';

const run = (url: string, performance: number, metrics?: Metrics) => ({
  url,
  summary: { performance, accessibility: 1, 'best-practices': 1, seo: 1 },
  ...(metrics === undefined ? {} : { metrics }),
});
/** A run report holding these metric values, as Lighthouse names them. */
const report = (fcp: number, lcp: number, tbt: number, cls: number) => ({
  audits: {
    'first-contentful-paint': { numericValue: fcp },
    'largest-contentful-paint': { numericValue: lcp },
    'total-blocking-time': { numericValue: tbt },
    'cumulative-layout-shift': { numericValue: cls },
  },
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

describe('metrics', () => {
  it('reads FCP, LCP, TBT and CLS from a run report, leaving out what it lacks', () => {
    expect(reportMetrics(report(763.4, 2217, 137, 0.0003))).toEqual({
      FCP: 763.4,
      LCP: 2217,
      TBT: 137,
      CLS: 0.0003,
    });
    expect(reportMetrics({ audits: { 'first-contentful-paint': {} } })).toEqual({});
    expect(reportMetrics({})).toEqual({});
  });

  it('shows the median of each metric per page, in ms and CLS to three decimals', () => {
    const table = lighthouseTable([
      run('http://x/fa', 0.97, { FCP: 700, LCP: 2300, TBT: 150, CLS: 0 }),
      run('http://x/fa', 0.97, { FCP: 763.4, LCP: 2217, TBT: 137, CLS: 0.0004 }),
      run('http://x/fa', 0.97, { FCP: 900, LCP: 2100, TBT: 90, CLS: 0.002 }),
      run('http://x/en', 0.96, { FCP: 1000, LCP: 2300, TBT: 100, CLS: 0.01 }),
      run('http://x/en', 0.96, { FCP: 1100, LCP: 2400, TBT: 200, CLS: 0.02 }),
    ]);
    expect(table).toContain('| Page | FCP | LCP | TBT | CLS |');
    expect(table).toContain('| /fa | 763 ms | 2217 ms | 137 ms | 0.000 |');
    expect(table).toContain('| /en | 1050 ms | 2350 ms | 150 ms | 0.015 |');
  });

  it('takes the median over the runs that have a metric, and says n/a when none has it', () => {
    const table = lighthouseTable([
      run('http://x/fa', 0.97, { FCP: 800, LCP: 2000 }),
      run('http://x/fa', 0.97),
      run('http://x/en', 0.96),
    ]);
    expect(table).toContain('| /fa | 800 ms | 2000 ms | n/a | n/a |');
    expect(table).toContain('| /en | n/a | n/a | n/a | n/a |');
  });
});

describe('lighthouseNotices', () => {
  it('writes one notice per page with its scores and median metrics', () => {
    const notices = lighthouseNotices([
      run('http://localhost:3100/fa', 0.95, { FCP: 760, LCP: 2200, TBT: 130, CLS: 0 }),
      run('http://localhost:3100/fa', 0.99, { FCP: 770, LCP: 2210, TBT: 140, CLS: 0 }),
      run('http://localhost:3100/fa', 0.97, { FCP: 780, LCP: 2220, TBT: 150, CLS: 0 }),
      run('http://localhost:3100/en', 0.98),
    ]);
    expect(notices.split('\n')).toEqual([
      '::notice title=Lighthouse /fa (3 runs)::performance 97 (95–99), accessibility 100, best-practices 100, seo 100; median FCP 770 ms, LCP 2210 ms, TBT 140 ms, CLS 0.000',
      '::notice title=Lighthouse /en (1 runs)::performance 98, accessibility 100, best-practices 100, seo 100; median FCP n/a, LCP n/a, TBT n/a, CLS n/a',
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

describe('scripts/lighthouse-summary.ts', () => {
  it('reads each run report the manifest names', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lighthouse-summary-'));
    mkdirSync(join(dir, '.lighthouseci'));
    const lhr = join(dir, 'fa.report.json');
    writeFileSync(lhr, JSON.stringify(report(763, 2217, 137, 0)));
    const manifest = [
      { url: 'http://x/fa', summary: run('http://x/fa', 0.97).summary, jsonPath: lhr },
      {
        url: 'http://x/en',
        summary: run('http://x/en', 0.96).summary,
        jsonPath: join(dir, 'gone.json'),
      },
    ];
    writeFileSync(join(dir, '.lighthouseci/manifest.json'), JSON.stringify(manifest));
    const script = resolve('scripts/lighthouse-summary.ts');
    const output = spawnSync(process.execPath, [script], { cwd: dir, encoding: 'utf8' });
    expect(output.status).toBe(0);
    expect(output.stdout).toContain('| /fa | 763 ms | 2217 ms | 137 ms | 0.000 |');
    expect(output.stdout).toContain('| /en | n/a | n/a | n/a | n/a |');
  });
});
