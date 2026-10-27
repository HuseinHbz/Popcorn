import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

type Assertion = [string, { minScore?: number; aggregationMethod?: string }];

const config = JSON.parse(readFileSync('lighthouserc.json', 'utf8')) as {
  ci: { collect: { numberOfRuns: number }; assert: { assertions: Record<string, Assertion> } };
};
const categories = Object.entries(config.ci.assert.assertions).filter(([key]) =>
  key.startsWith('categories:'),
);

describe('lighthouserc.json', () => {
  it('runs each page an odd number of times, so the median is a real run', () => {
    expect(config.ci.collect.numberOfRuns % 2).toBe(1);
  });

  // LHCI's "median-run" (and the default) assert the BEST run for minScore,
  // so one lucky run could pass the gate. Only "median" checks the median.
  it('asserts every category on the median of the runs, as an error', () => {
    expect(categories.map(([key]) => key).sort()).toEqual([
      'categories:accessibility',
      'categories:best-practices',
      'categories:performance',
      'categories:seo',
    ]);
    for (const [, [level, options]] of categories) {
      expect(level).toBe('error');
      expect(options.aggregationMethod).toBe('median');
    }
  });

  it('holds the DoD thresholds for every category', () => {
    const min = Object.fromEntries(categories.map(([key, [, o]]) => [key, o.minScore]));
    expect(min).toEqual({
      'categories:performance': 0.95,
      'categories:accessibility': 1,
      'categories:best-practices': 0.95,
      'categories:seo': 0.95,
    });
  });
});
