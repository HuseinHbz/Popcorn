import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

// Raw colour literals are banned outside the token source (CLAUDE.md: tokens only).
const RAW_HEX = '/#[0-9a-fA-F]{3,8}\\b/';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
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
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/*/server/*'],
              message:
                "Use the module's public service (`@/modules/<name>/server`), not its internals.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=${RAW_HEX}]`,
          message: 'Use a design token, not a raw hex colour.',
        },
        {
          selector: `TemplateElement[value.raw=${RAW_HEX}]`,
          message: 'Use a design token, not a raw hex colour.',
        },
      ],
    },
  },
  {
    // Domain code is pure TypeScript: no framework, DB or I/O (CLAUDE.md).
    files: ['src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'next',
                'next/*',
                'react',
                'react-dom',
                'drizzle-orm',
                'drizzle-orm/*',
                'pg',
                'ioredis',
                'bullmq',
                'node:*',
                '@/modules/*/server',
                '@/modules/*/server/*',
                '@/shared/auth/*',
                '@/shared/config/*',
                '@/shared/i18n/*',
                '@/shared/ui/*',
              ],
              message: '`domain/` must stay pure: no framework, DB, I/O or server imports.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'e2e/**/*.ts'],
    rules: { 'max-lines-per-function': 'off' },
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
  ]),
]);
