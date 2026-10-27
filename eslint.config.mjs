import boundaries from 'eslint-plugin-boundaries';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

// Raw colour literals are banned outside the token source (CLAUDE.md: tokens only).
const RAW_COLOR = '/#[0-9a-fA-F]{3,8}\\b|\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(/';
const TOKEN_SYNTAX = [
  { selector: `Literal[value=${RAW_COLOR}]`, message: 'Use a design token, not a raw colour.' },
  {
    selector: `TemplateElement[value.raw=${RAW_COLOR}]`,
    message: 'Use a design token, not a raw colour.',
  },
];

// Pure code reads no ambient state: the clock and randomness are passed in.
const PURE_MESSAGE = '`domain/` and `shared/lib` must stay pure: pass the clock or randomness in.';
const PURE_SYNTAX = [
  {
    selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: PURE_MESSAGE,
  },
  { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: PURE_MESSAGE },
  {
    selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
    message: PURE_MESSAGE,
  },
];

const SAME_MODULE = { module: '{{ from.element.captured.module }}' };

/**
 * Module boundaries (ADR 0001, CLAUDE.md "Layout"). Dependencies are resolved to
 * files, so relative and aliased imports are treated alike.
 */
const boundaryElements = [
  { type: 'domain', pattern: 'src/modules/*/domain', capture: ['module'] },
  { type: 'server', pattern: 'src/modules/*/server', capture: ['module'] },
  { type: 'ui', pattern: 'src/modules/*/ui', capture: ['module'] },
  // Files directly in a module folder, i.e. `schema.ts`.
  { type: 'module-root', pattern: 'src/modules/*', capture: ['module'] },
  { type: 'app', pattern: 'src/app' },
  { type: 'shared-lib', pattern: 'src/shared/lib' },
  { type: 'shared', pattern: 'src/shared/*', capture: ['area'] },
  // Files directly in `src/`: proxy.ts, global.d.ts.
  { type: 'src-root', pattern: 'src' },
];

const publicServer = { type: 'server', fileInternalPath: 'index.ts' };

const boundaryPolicies = [
  // `domain/` is pure: same-module domain code and pure shared helpers only.
  {
    from: { element: { type: 'domain' } },
    allow: {
      to: { element: [{ type: 'domain', captured: SAME_MODULE }, { type: 'shared-lib' }] },
    },
  },
  {
    from: { element: { type: 'server' } },
    allow: {
      to: {
        element: [
          { types: ['domain', 'server', 'module-root'], captured: SAME_MODULE },
          publicServer,
          { types: ['shared', 'shared-lib'] },
        ],
      },
    },
  },
  {
    from: { element: { type: 'ui' } },
    allow: {
      to: {
        element: [
          { types: ['domain', 'ui', 'module-root'], captured: SAME_MODULE },
          { ...publicServer, captured: SAME_MODULE },
          { types: ['shared', 'shared-lib'] },
        ],
      },
    },
  },
  {
    from: { element: { type: 'module-root' } },
    allow: { to: { element: [{ type: 'domain', captured: SAME_MODULE }, { type: 'shared-lib' }] } },
  },
  {
    from: { element: { types: ['app', 'src-root'] } },
    allow: { to: { element: [publicServer, { types: ['ui', 'app', 'shared', 'shared-lib'] }] } },
  },
  {
    from: { element: { type: 'shared' } },
    allow: { to: { element: { types: ['shared', 'shared-lib'] } } },
  },
  { from: { element: { type: 'shared-lib' } }, allow: { to: { element: { type: 'shared-lib' } } } },
  // Packages and Node built-ins: everywhere except pure code.
  {
    from: { element: { type: '!{domain,shared-lib}' } },
    allow: { to: { module: { origin: ['external', 'core'] } } },
  },
];

const IMPURE_GLOBALS = [
  'fetch',
  'process',
  'window',
  'document',
  'globalThis',
  'self',
  'navigator',
  'location',
  'console',
  'crypto',
  'performance',
  'localStorage',
  'sessionStorage',
  'XMLHttpRequest',
  'WebSocket',
  'setTimeout',
  'setInterval',
  'Buffer',
];

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    linterOptions: {
      // No inline `eslint-disable` at all: an exception is an override in this file,
      // next to the ADR link that justifies it (CLAUDE.md non-negotiables).
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // tests/fixtures/src mirrors src/ so tests/lint-rules.test.ts can prove these rules fire.
    files: ['src/**/*.{ts,tsx}', 'tests/fixtures/src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': boundaryElements,
      'import/resolver': { typescript: { alwaysTryTypes: true } },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          // Also check packages, Node built-ins and files outside any element.
          checkAllOrigins: true,
          checkUnknownLocals: true,
          policies: boundaryPolicies,
        },
      ],
      'no-restricted-syntax': ['error', ...TOKEN_SYNTAX],
    },
  },
  {
    // Pure code performs no I/O and reads no ambient state.
    files: [
      'src/modules/*/domain/**/*.{ts,tsx}',
      'src/shared/lib/**/*.{ts,tsx}',
      'tests/fixtures/src/modules/*/domain/**/*.{ts,tsx}',
      'tests/fixtures/src/shared/lib/**/*.{ts,tsx}',
    ],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...TOKEN_SYNTAX, ...PURE_SYNTAX],
      'no-restricted-globals': [
        'error',
        ...IMPURE_GLOBALS.map((name) => ({
          name,
          message: '`domain/` and `shared/lib` must stay pure: no I/O or ambient globals.',
        })),
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'e2e/**/*.ts'],
    rules: { 'max-lines-per-function': 'off' },
  },
  {
    // Unit tests may import the test runner wherever they live.
    files: ['src/**/*.test.ts'],
    rules: { 'boundaries/dependencies': 'off' },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    '.lighthouseci/**',
    'next-env.d.ts',
    // Deliberately violating fixtures; linted only by tests/lint-rules.test.ts.
    'tests/fixtures/**',
  ]),
]);
