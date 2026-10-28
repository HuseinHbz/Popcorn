import { readFileSync } from 'node:fs';

import boundaries from 'eslint-plugin-boundaries';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

/**
 * A value chosen by `?:`, `||`, `&&` or `??`, or wrapped by a TypeScript `as`, `satisfies` or
 * `!`: each branch, and the wrapped value, is checked like a plain value, two levels deep in
 * every rule that uses it (`(ok ? 'red' : 'blue') as string`).
 */
const BRANCH =
  ':matches(ConditionalExpression, LogicalExpression, TSAsExpression, TSSatisfiesExpression, TSNonNullExpression)';

/** `value` where `parent` ends (`… > .value` or `… > `), and inside one or two BRANCHes there. */
const branches = (parent, value) => [
  `${parent}${value}`,
  `${parent}${BRANCH} > ${value}`,
  `${parent}${BRANCH} > ${BRANCH} > ${value}`,
];
const rules = (message, selectors) => selectors.map((selector) => ({ selector, message }));

// CLAUDE.md: only design tokens for colour, spacing, radius and font. Bans raw colours
// (hex, colour functions) anywhere; Tailwind arbitrary values and properties (`w-[13px]`,
// `[color:red]`); literal values for colour properties in any object; the 148 named colours
// in colour-bearing values (`border: '1px solid red'`) and SVG colour attributes; and
// literal spacing, radius and font values in inline `style` attributes. Dynamic values
// and CSS custom properties stay allowed.
const NAMED_COLORS = JSON.parse(
  readFileSync(new URL('scripts/named-colors.json', import.meta.url), 'utf8'),
);
const NAMED_COLOR = `/\\b(?:${NAMED_COLORS.join('|')})\\b/i`;
const RAW_COLOR = '/#[0-9a-fA-F]{3,8}\\b|\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(/';
const ARBITRARY_VALUE =
  '/(?:^|\\s)!?-?[a-z][a-z0-9:-]*-\\[[^\\]\\s]+\\]|(?:^|\\s)!?(?:[a-z0-9-]+:)*\\[[a-z-]+:[^\\]\\s]+\\]/';
const COLOR_KEY = '/^(?:background|fill|stroke|[a-zA-Z]*[cC]olor)$/';
const COLOR_BEARING_KEY =
  '/(?:background|border|outline|shadow|fill|stroke|caret|decoration|columnrule)/i';
const SIZE_KEY =
  '/^(?:(?:margin|padding|inset|scrollMargin|scrollPadding)[A-Za-z]*|(?:row|column)?[gG]ap|top|right|bottom|left|border[A-Za-z]*Radius|font[A-Za-z]*|lineHeight|letterSpacing)$/';
const SVG_COLOR_ATTRIBUTE = '/^(?:fill|stroke|color|stopColor|floodColor|lightingColor)$/';
const keyMatches = (pattern) => `:matches([key.name=${pattern}], [key.value=${pattern}])`;
const VALUE = ':matches(Literal, TemplateLiteral)';
const NAMED_VALUE = `:matches(Literal[value=${NAMED_COLOR}], TemplateLiteral:has(TemplateElement[value.raw=${NAMED_COLOR}]))`;
const SIZE_VALUE =
  ":matches(Literal, UnaryExpression[argument.type='Literal'], TemplateLiteral[expressions.length=0])";
const COLOR_PROPERTY = `Property${keyMatches(COLOR_KEY)}`;
const BEARING_PROPERTY = `Property${keyMatches(COLOR_BEARING_KEY)}:not(${keyMatches(COLOR_KEY)})`;
const SIZE_PROPERTY = `JSXAttribute[name.name='style'] Property${keyMatches(SIZE_KEY)}`;
const TOKEN_SYNTAX = [
  ...rules('Use a design token, not a raw colour.', [
    `Literal[value=${RAW_COLOR}]`,
    `TemplateElement[value.raw=${RAW_COLOR}]`,
  ]),
  ...rules('Use a theme token, not a Tailwind arbitrary value.', [
    `Literal[value=${ARBITRARY_VALUE}]`,
    `TemplateElement[value.raw=${ARBITRARY_VALUE}]`,
  ]),
  ...rules(
    'Use a design-token class, not an inline colour value.',
    branches(`${COLOR_PROPERTY} > .value`, VALUE),
  ),
  ...rules('Use a design token, not a named colour.', [
    ...branches(`${BEARING_PROPERTY} > .value`, NAMED_VALUE),
    `JSXAttribute[name.name=${SVG_COLOR_ATTRIBUTE}] Literal[value=${NAMED_COLOR}]`,
    `JSXAttribute[name.name=${SVG_COLOR_ATTRIBUTE}] TemplateElement[value.raw=${NAMED_COLOR}]`,
  ]),
  ...rules(
    'Use a spacing, radius or font token class, not an inline value.',
    branches(`${SIZE_PROPERTY} > .value`, SIZE_VALUE),
  ),
];

// CLAUDE.md: every user-facing string goes through next-intl. JSX text, wrapped or not,
// is covered by react/jsx-no-literals (noStrings); these catch literal text in user-facing
// attributes, in the visible `value` of submit, reset and button inputs, and in JSX
// children, directly or inside a BRANCH. A literal passed to a function (a message key) is
// not text and is allowed.
const TEXT_ATTRIBUTE =
  '/^(?:alt|title|placeholder|label|aria-label|aria-description|aria-placeholder|aria-roledescription|aria-valuetext)$/';
const TEXT = ':matches(Literal[value=/\\S/], TemplateLiteral)';
const BUTTON_INPUT =
  "JSXOpeningElement[name.name='input']:has(JSXAttribute[name.name='type'] > Literal[value=/^(?:submit|reset|button)$/])";
const I18N_SYNTAX = rules('User-facing text comes from next-intl, not a literal.', [
  `JSXAttribute[name.name=${TEXT_ATTRIBUTE}] > ${TEXT}`,
  ...branches(`JSXAttribute[name.name=${TEXT_ATTRIBUTE}] > JSXExpressionContainer > `, TEXT),
  `${BUTTON_INPUT} > JSXAttribute[name.name='value'] > ${TEXT}`,
  ...branches(
    `${BUTTON_INPUT} > JSXAttribute[name.name='value'] > JSXExpressionContainer > `,
    TEXT,
  ),
  // JSX children: jsx-no-literals sees `{'text'}` itself (dropped here), not text in a branch.
  ...branches(':matches(JSXElement, JSXFragment) > JSXExpressionContainer > ', TEXT).slice(1),
]);

// Pure code reads no ambient state: the clock and randomness are passed in.
const PURE_MESSAGE = '`domain/` and `shared/lib` must stay pure: pass the clock or randomness in.';
const PURE_SYNTAX = [
  // Date.now and Math.random, whether called or passed around.
  "MemberExpression[object.name='Date'][property.name='now']",
  "MemberExpression[object.name='Math'][property.name='random']",
  // Computed access hides the member name: Date['now'](), Math[key]().
  'MemberExpression[object.name=/^(?:Date|Math)$/][computed=true]',
  // Date() returns the current time whatever its arguments; so does new Date().
  "CallExpression[callee.name='Date']",
  "NewExpression[callee.name='Date'][arguments.length=0]",
  // Any other use of Date or Math as a value is an alias that escapes the rules above
  // (const D = Date; Reflect.get(Math, 'random')). Members, `new Date(x)`, `instanceof`
  // and type positions stay allowed.
  "Identifier[name=/^(?:Date|Math)$/]:not(MemberExpression > .object, NewExpression > .callee, CallExpression > .callee, BinaryExpression[operator='instanceof'] > .right, TSTypeReference > .typeName, TSQualifiedName > .left)",
  // Intl formatters read the clock when called without a date.
  'CallExpression[callee.property.name=/^format(?:ToParts)?$/][arguments.length=0]',
].map((selector) => ({ selector, message: PURE_MESSAGE }));

// Raw HTML outside the forms react/no-danger sees: createElement props, spread objects,
// computed keys, <iframe srcDoc> and the DOM HTML sinks Trusted Types guards (security
// reviews round 4 G4, round 5 H5, round 6 J6; code review round 6). In both
// no-restricted-syntax lists, because a later list replaces an earlier one.
const HTML_SINK =
  'dangerouslySetInnerHTML|srcdoc|innerHTML|outerHTML|insertAdjacentHTML|createContextualFragment|parseFromString|setHTMLUnsafe|parseHTMLUnsafe';
const HTML_PROPERTY = '/^(?:dangerouslySetInnerHTML|srcdoc|innerHTML|outerHTML)$/i';
const HTML_CALL =
  '/^(?:insertAdjacentHTML|createContextualFragment|parseFromString|setHTMLUnsafe|parseHTMLUnsafe)$/';
const TS_WRAPPER = ':matches(TSAsExpression, TSSatisfiesExpression, TSNonNullExpression)';
const UNSAFE_SYNTAX = rules('No raw HTML: render React elements instead.', [
  // A string naming a sink, outside type positions: string keys, computed members
  // (node['outerHTML']), Reflect.set, setAttribute('srcdoc'), a key kept in a variable.
  `Literal:not(TSLiteralType > Literal)[value=/^(?:${HTML_SINK})$/i]`,
  `TemplateLiteral[expressions.length=0] > TemplateElement[value.raw=/^(?:${HTML_SINK})$/i]`,
  // A computed template key with a sink name in any static part.
  'Property[computed=true] > TemplateLiteral.key[expressions.length>0] > TemplateElement[value.raw=/dangerouslySetInnerHTML|srcdoc|innerHTML|outerHTML/i]',
  // An object key named after a sink: createElement props, spreads, Object.assign(node, {…}).
  // Destructuring (reading) is a pattern, not an object expression, and stays allowed.
  `ObjectExpression > Property[computed=false][key.name=${HTML_PROPERTY}]`,
  "JSXAttribute[name.name='srcDoc']",
  // Assigning a sink (node.innerHTML, frame.srcdoc), also through `as`, `satisfies` or `!`.
  `AssignmentExpression > MemberExpression.left[computed=false][property.name=${HTML_PROPERTY}]`,
  `AssignmentExpression > ${TS_WRAPPER}.left > MemberExpression[computed=false][property.name=${HTML_PROPERTY}]`,
  // Calling an API that parses an HTML string; an inline event-handler attribute.
  `CallExpression > MemberExpression.callee[computed=false][property.name=${HTML_CALL}]`,
  "CallExpression[callee.property.name='setAttribute'] > Literal.arguments:first-child[value=/^on/i]",
  // document.write and writeln, on this page's document or another one.
  "CallExpression > MemberExpression.callee:matches([object.name='document'], [object.property.name=/^(?:document|contentDocument)$/]):matches([property.name=/^write(?:ln)?$/], [property.value=/^write(?:ln)?$/])",
]);

const SAME_MODULE = { module: '{{ from.element.captured.module }}' };

// Every extension a source file could have: the project rules must not depend on choosing
// `.ts`. Only `.ts` and `.tsx` may exist under src/ (tests/source-extensions.test.ts); the
// rest are linted here so a stray file still fails (security review round 7, K4).
const SOURCE = '{ts,tsx,mts,cts,js,jsx,mjs,cjs}';

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
  'indexedDB',
  'caches',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'queueMicrotask',
  'requestAnimationFrame',
  'requestIdleCallback',
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
      // No code execution from strings and no unescaped markup (security review F8).
      // A JSON-LD script tag will need a react/no-danger override with an ADR link.
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'react/no-danger': 'error',
      'react/jsx-no-script-url': 'error',
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // tests/fixtures/src mirrors src/ so tests/lint-rules.test.ts can prove these rules fire.
    files: [`src/**/*.${SOURCE}`, `tests/fixtures/src/**/*.${SOURCE}`],
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
      'no-restricted-syntax': ['error', ...TOKEN_SYNTAX, ...I18N_SYNTAX, ...UNSAFE_SYNTAX],
      'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true }],
    },
  },
  {
    // Pure code performs no I/O and reads no ambient state.
    files: [
      `src/modules/*/domain/**/*.${SOURCE}`,
      `src/shared/lib/**/*.${SOURCE}`,
      `tests/fixtures/src/modules/*/domain/**/*.${SOURCE}`,
      `tests/fixtures/src/shared/lib/**/*.${SOURCE}`,
    ],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...TOKEN_SYNTAX,
        ...I18N_SYNTAX,
        ...UNSAFE_SYNTAX,
        ...PURE_SYNTAX,
      ],
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
    files: ['**/*.{js,jsx,mjs,cjs}'],
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
