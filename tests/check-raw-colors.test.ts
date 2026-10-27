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

  it('reports CSS named colours in colour-bearing declarations', () => {
    const css = '.a { color: red; }\n.b { border: 1px solid white; }\n.c { fill: currentColor; }\n';
    expect(findRawColors(css)).toEqual([
      { line: 1, match: 'red' },
      { line: 2, match: 'white' },
    ]);
  });

  it('ignores colour names outside colour-bearing declarations', () => {
    expect(findRawColors('.tan-card { content: "red"; animation-name: orange; }')).toEqual([]);
  });

  it('allows token references', () => {
    expect(findRawColors('.a { color: var(--color-ink); }')).toEqual([]);
  });
});
