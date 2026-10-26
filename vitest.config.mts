import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // DoD: ≥ 90% in domain code and pure shared helpers (CLAUDE.md).
      include: [
        'src/modules/*/domain/**/*.ts',
        'src/shared/lib/**/*.ts',
        'src/shared/i18n/*.ts',
        'src/proxy.ts',
      ],
      exclude: ['**/*.test.ts', 'src/shared/i18n/request.ts', 'src/shared/i18n/navigation.ts'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
