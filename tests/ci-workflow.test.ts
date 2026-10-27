import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');

describe('.github/workflows/ci.yml', () => {
  // AC9: every commit a push adds is linted by that push's run. A shared concurrency
  // group on main would let GitHub replace a queued run, skipping its commits.
  it('gives every run on main its own concurrency group and never cancels there', () => {
    expect(workflow).toContain(
      "group: ci-${{ github.event_name }}-${{ github.ref == 'refs/heads/main' && github.sha || github.ref }}",
    );
    expect(workflow).toContain("cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}");
  });

  it('lints the pushed range on main and the whole branch elsewhere', () => {
    expect(workflow).toContain('pnpm exec commitlint --from origin/main --to HEAD');
    expect(workflow).toContain('pnpm exec commitlint --from "${BEFORE}" --to HEAD');
  });
});
