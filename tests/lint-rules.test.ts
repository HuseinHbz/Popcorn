import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Proves the CLAUDE.md non-negotiables enforced by eslint.config.mjs actually fire
 * (story platform-foundation AC8). Fixtures in tests/fixtures/src mirror the real
 * `src/` layout and are excluded from the normal lint run. Each fixture line marks the
 * findings it must produce with an `expect: rule-a, rule-b` comment; every other line
 * must produce none, so a rule that stops firing or starts misfiring fails here.
 */
const root = fileURLToPath(new URL('..', import.meta.url));
const fixture = (path: string): string => `tests/fixtures/src/${path}`;

type Finding = { ruleId: string | null; severity: number; line: number };
const findings = new Map<string, Finding[]>();

beforeAll(async () => {
  const eslint = new ESLint({ cwd: root, ignore: false });
  const results = await eslint.lintFiles([fixture('**/*.{ts,tsx}')]);
  for (const result of results) {
    const key = result.filePath.slice(result.filePath.indexOf('tests/fixtures/src/') + 19);
    findings.set(
      key,
      result.messages.map(({ ruleId, severity, line }) => ({ ruleId, severity, line })),
    );
  }
}, 120_000);

const rulesIn = (path: string): Array<string | null> =>
  (findings.get(path) ?? []).map((finding) => finding.ruleId);

/** Fixture paths relative to tests/fixtures/src. */
const fixtures = readdirSync(`${root}tests/fixtures/src`, { recursive: true, encoding: 'utf8' })
  .filter((path) => /\.tsx?$/.test(path))
  .sort();

/** `line:rule` for every `expect:` marker; `inline-config` stands for an ignored directive. */
function expectedIn(path: string): string[] {
  const lines = readFileSync(`${root}${fixture(path)}`, 'utf8').split('\n');
  return lines
    .flatMap((text, index) => {
      const rules = /expect: ([^)*]+?)\s*(?:\)|\*\/\}?)?\s*$/.exec(text)?.[1] ?? '';
      return rules ? rules.split(',').map((rule) => `${String(index + 1)}:${rule.trim()}`) : [];
    })
    .sort();
}

const actualIn = (path: string): string[] =>
  (findings.get(path) ?? [])
    .map(({ line, ruleId }) => `${String(line)}:${ruleId ?? 'inline-config'}`)
    .sort();

describe('fixtures', () => {
  it.each(fixtures)('%s reports exactly the findings its comments mark', (path) => {
    expect(findings.has(path)).toBe(true);
    expect(actualIn(path)).toEqual(expectedIn(path));
  });
});

describe('module boundaries', () => {
  it.each([
    'modules/orders/domain/order.ts',
    'modules/orders/server/index.ts',
    'modules/orders/server/repository.ts',
    'modules/payments/server/index.ts',
    'app/uses-public-service.ts',
  ])('allows %s', (path) => {
    expect(findings.has(path)).toBe(true);
    expect(rulesIn(path)).toEqual([]);
  });

  it.each([
    [
      'another module’s server internals via a relative path',
      'modules/payments/server/reaches-internals.ts',
    ],
    ['domain importing its own server layer', 'modules/orders/domain/imports-server.ts'],
    ['app importing a module’s domain directly', 'app/imports-domain.ts'],
  ])('rejects %s', (_, path) => {
    expect(rulesIn(path)).toContain('boundaries/dependencies');
  });
});

describe('pure code', () => {
  it('rejects Node built-ins and I/O globals in domain/', () => {
    const rules = rulesIn('modules/orders/domain/impure.ts');
    expect(rules).toContain('boundaries/dependencies');
    expect(rules).toContain('no-restricted-globals');
  });

  it('rejects Node built-ins in shared/lib', () => {
    expect(rulesIn('shared/lib/impure.ts')).toContain('boundaries/dependencies');
  });

  it.each(['modules/orders/domain/imports-package.ts', 'shared/lib/imports-package.ts'])(
    'rejects npm packages in %s',
    (path) => {
      expect(rulesIn(path)).toContain('boundaries/dependencies');
    },
  );

  it('rejects the clock, randomness and ambient globals', () => {
    const rules = rulesIn('modules/orders/domain/ambient.ts');
    // Date.now(), new Date(), Math.random()
    expect(rules.filter((rule) => rule === 'no-restricted-syntax')).toHaveLength(3);
    // globalThis, console
    expect(rules.filter((rule) => rule === 'no-restricted-globals')).toHaveLength(2);
  });

  it('rejects Date(), computed access, aliases, argument-less Intl formatting and more I/O', () => {
    // Exact lines, and the pure uses that stay allowed, are marked in the fixture.
    const rules = rulesIn('modules/orders/domain/ambient-bypasses.ts');
    expect(rules.filter((rule) => rule === 'no-restricted-syntax')).toHaveLength(8);
    expect(rules.filter((rule) => rule === 'no-restricted-globals')).toHaveLength(5);
  });

  it('applies to .tsx files in domain/ too', () => {
    expect(rulesIn('modules/orders/domain/status-badge.tsx')).toContain('no-restricted-globals');
  });
});

describe('code rules', () => {
  it('rejects hex and colour-function literals', () => {
    const rules = rulesIn('shared/ui/raw-colors.ts');
    // '#a8322a', 'rgb(…)', and 'bg-[oklch(…)]' twice: colour function and arbitrary value.
    expect(rules.filter((rule) => rule === 'no-restricted-syntax')).toHaveLength(4);
  });

  it('rejects inline colour values and Tailwind arbitrary values', () => {
    const rules = rulesIn('shared/ui/named-colors.tsx');
    // color: 'red', backgroundColor: 'white', "text-[red] w-[13px]"
    expect(rules.filter((rule) => rule === 'no-restricted-syntax')).toHaveLength(3);
  });

  it('rejects quoted, templated, named and SVG colours and inline spacing, radius and font', () => {
    // Exact lines, and the dynamic values and keywords that stay allowed, are in the fixture.
    expect(rulesIn('shared/ui/token-bypasses.tsx')).toHaveLength(22);
  });

  it('rejects user-facing text that bypasses next-intl', () => {
    const rules = rulesIn('shared/ui/literal-text.tsx');
    expect(rules).toContain('react/jsx-no-literals');
    expect(rules).toContain('no-restricted-syntax');
  });

  it('rejects wrapped, conditional and fallback text in attributes, children and button values', () => {
    // Exact lines, and the allowed cases (message keys, non-text values), are marked in the fixture.
    expect(rulesIn('shared/ui/literal-text-bypasses.tsx')).toHaveLength(19);
  });

  it('ignores inline eslint-disable and still reports the violation it hides', () => {
    const messages = findings.get('shared/ui/inline-disable.ts') ?? [];
    expect(messages).toContainEqual({ ruleId: null, severity: 1, line: 1 });
    expect(messages.map((message) => message.ruleId)).toContain(
      '@typescript-eslint/no-explicit-any',
    );
  });

  it('rejects eval, new Function, dangerouslySetInnerHTML and javascript: URLs', () => {
    expect(rulesIn('shared/ui/unsafe-code.tsx')).toEqual(
      expect.arrayContaining([
        'no-eval',
        'no-new-func',
        'react/no-danger',
        'react/jsx-no-script-url',
      ]),
    );
  });

  it('rejects raw HTML through props objects, computed keys, srcDoc and the DOM HTML sinks', () => {
    // Each line is marked in the fixture, with the allowed look-alikes; react/no-danger misses all.
    const rules = rulesIn('shared/ui/unsafe-code.tsx');
    expect(rules.filter((rule) => rule === 'no-restricted-syntax')).toHaveLength(9);
  });

  it('rejects @ts-ignore', () => {
    expect(rulesIn('shared/ui/ts-ignore.ts')).toContain('@typescript-eslint/ban-ts-comment');
  });

  it('rejects functions longer than 40 lines', () => {
    expect(rulesIn('shared/ui/long-function.ts')).toContain('max-lines-per-function');
  });

  it('rejects files longer than 300 lines', () => {
    expect(rulesIn('shared/ui/long-file.ts')).toContain('max-lines');
  });
});
