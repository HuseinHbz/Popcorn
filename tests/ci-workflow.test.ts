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
    expect(workflow).toContain('node scripts/lint-commits.ts origin/main HEAD');
    expect(workflow).toContain('node scripts/lint-commits.ts "${BEFORE}" HEAD');
    expect(workflow).toContain('ACTOR: ${{ github.actor }}');
    expect(workflow).not.toContain('pnpm exec commitlint');
  });

  // Security review round 9, Q2: `git archive` and `git add` apply these attributes, and each
  // can hide or rewrite a file's bytes in the tree the scans read.
  it('unsets every attribute that changes the scanned bytes, on both sides of the export', () => {
    const overrides = [
      ...workflow.matchAll(/printf '([^']*)' > ("\$tree\/)?\.git\/info\/attributes/g),
    ].map(([, lines = '']) => lines.split('\\n').filter(Boolean));
    const exported = ['export-ignore', 'export-subst', 'ident', 'filter', 'text', 'eol', 'crlf'];
    const checkedIn = ['filter', 'text', 'eol', 'crlf', 'ident'];
    // The history scan's checkout, the scan repository, then Semgrep's export.
    const required = [
      ['diff', ...exported, 'working-tree-encoding'],
      ['diff', ...checkedIn, 'working-tree-encoding'],
      [...exported, 'working-tree-encoding'],
    ];
    expect(overrides).toHaveLength(required.length);
    required.forEach((attributes, index) => {
      expect(overrides[index]).toEqual(expect.arrayContaining(attributes.map((a) => `* !${a}`)));
    });
  });

  it("fails the tree scan unless the scanned blobs are exactly HEAD's", () => {
    expect(workflow).toContain("committed=$(git ls-tree -r HEAD | grep -v $'\\t.gitleaksignore$')");
    expect(workflow).toContain(
      'scanned=$(git -C "$tree" ls-tree -r HEAD | grep -v $\'\\t.ci-canary$\')',
    );
    expect(workflow).toContain('if [ "$committed" != "$scanned" ]; then');
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

  // Security review round 9, Q1: with rename detection, text renamed from an accepted image is
  // diffed as binary and never read. The coverage check judges each change at its own path,
  // so the history scan must pair changes the same way.
  it('pairs changes in the history scan as the coverage check does, without renames', () => {
    const compose = readFileSync('.github/ci-tools/compose.yaml', 'utf8');
    const logOpts = /--log-opts=(.*)$/m.exec(compose)?.[1]?.split(' ') ?? [];
    expect(logOpts).toEqual(expect.arrayContaining(['--all', '-m', '--no-renames']));
    expect(readFileSync('scripts/check-scan-coverage.ts', 'utf8')).toContain("'--no-renames'");
  });
});
