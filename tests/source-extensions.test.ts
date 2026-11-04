import { readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// CLAUDE.md: TypeScript strict. Next.js builds a `.js` page without complaint, so only
// TypeScript sources may exist under src/ (security review round 7, K4; code review T14).
const NOT_TYPESCRIPT = /\.(?:[cm]?jsx?|[cm]ts)$/;

describe('src/', () => {
  it('holds no JavaScript and no .mts or .cts source', () => {
    const files = readdirSync('src', { recursive: true, encoding: 'utf8' });
    expect(files.filter((path) => NOT_TYPESCRIPT.test(path))).toEqual([]);
  });
});
