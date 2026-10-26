import { describe, expect, it, vi } from 'vitest';

import { config } from './proxy';

// The middleware itself needs the Next.js runtime; only the matcher is under test.
vi.mock('next-intl/middleware', () => ({ default: () => () => undefined }));

// Next.js compiles the matcher with path-to-regexp; the pattern is a single
// regex group, so anchoring it reproduces the same decision.
const matcher = new RegExp(`^${config.matcher[0] ?? ''}$`);

describe('proxy matcher', () => {
  it.each(['/', '/fa', '/en/menu', '/apiary', '/fa/menu/em.cafe', '/tables'])(
    'runs locale routing for %s',
    (path) => {
      expect(matcher.test(path)).toBe(true);
    },
  );

  it.each([
    '/api',
    '/api/health',
    '/_next/static/chunk.js',
    '/t/abc123',
    '/icon.svg',
    '/robots.txt',
    '/sitemap.xml',
    '/fonts/vazirmatn.woff2',
  ])('skips %s', (path) => {
    expect(matcher.test(path)).toBe(false);
  });
});
