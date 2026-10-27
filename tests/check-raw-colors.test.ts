import { describe, expect, it } from 'vitest';

import { findRawColors } from '../scripts/check-raw-colors';

describe('findRawColors', () => {
  it('allows colours inside @theme blocks', () => {
    expect(findRawColors('@theme {\n  --color-ink: #121212;\n}\n')).toEqual([]);
  });

  it('reports hex and colour functions outside @theme, with line numbers', () => {
    const css =
      '@theme {\n  --color-ink: #121212;\n}\n.a { color: #fff; }\n.b { fill: oklch(0.5 0.1 20); }\n';
    expect(findRawColors(css)).toEqual([
      { line: 4, match: '#fff' },
      { line: 5, match: 'oklch(' },
    ]);
  });

  it('allows token references', () => {
    expect(findRawColors('.a { color: var(--color-ink); }')).toEqual([]);
  });
});
