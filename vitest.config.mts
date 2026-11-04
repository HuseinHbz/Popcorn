import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // Lint fixtures (some named *.test.ts) are linted by tests/lint-rules.test.ts, never run.
    exclude: [...configDefaults.exclude, 'tests/fixtures/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // DoD: ≥ 90% in domain code and pure shared helpers (CLAUDE.md).
      include: [
        'src/modules/*/domain/**/*.ts',
        'src/shared/lib/**/*.ts',
        'src/shared/i18n/*.ts',
        'src/shared/config/*.ts',
        'src/proxy.ts',
      ],
      exclude: ['**/*.test.ts', 'src/shared/i18n/request.ts', 'src/shared/i18n/navigation.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
        // The check that guards every brand colour save (ADR 0019) is fully covered.
        'src/modules/brand/domain/**': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  },
});
