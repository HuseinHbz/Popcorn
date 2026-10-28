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

describe('.github/ci-tools', () => {
  // The secrets job checks tracked files against gitleaks' default path allowlist, copied
  // into gitleaks-skipped-paths.txt; a copy from another version would check the wrong list.
  it('copies the skipped paths from the gitleaks version the scans run', () => {
    const compose = readFileSync('.github/ci-tools/compose.yaml', 'utf8');
    const list = readFileSync('.github/ci-tools/gitleaks-skipped-paths.txt', 'utf8');
    const pinned = [...compose.matchAll(/ghcr\.io\/gitleaks\/gitleaks:(v[\d.]+)@/g)].map(
      (match) => match[1],
    );
    expect(pinned).toHaveLength(2);
    expect(new Set(pinned).size).toBe(1);
    expect(/gitleaks (v[\d.]+)'s default configuration/.exec(list)?.[1]).toBe(pinned[0]);
  });
});
