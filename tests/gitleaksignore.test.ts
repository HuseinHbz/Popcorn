import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/** `commit:path:rule:line`, the only form gitleaks fingerprints take in a history scan. */
const FINGERPRINT = /^[0-9a-f]{40}:[^:\s]+:[a-z0-9-]+:\d+$/;

/** Each fingerprint with the comment block directly above it (ADR 0016: a written reason). */
function ignoreEntries(text: string): Array<{ fingerprint: string; reason: string[] }> {
  const lines = text.split('\n').map((line) => line.trim());
  return lines.flatMap((line, index) => {
    if (line === '' || line.startsWith('#')) return [];
    const reason: string[] = [];
    for (let above = index - 1; above >= 0 && lines[above]?.startsWith('#'); above -= 1) {
      reason.unshift(lines[above] ?? '');
    }
    return [{ fingerprint: line, reason }];
  });
}

describe('.gitleaksignore', () => {
  const entries = ignoreEntries(readFileSync('.gitleaksignore', 'utf8'));

  it('holds only gitleaks fingerprints', () => {
    for (const { fingerprint } of entries) expect(fingerprint).toMatch(FINGERPRINT);
  });

  it('gives every fingerprint its own written reason directly above it', () => {
    for (const { fingerprint, reason } of entries) {
      expect(reason.join(' ').replace(/#/g, '').trim().length, fingerprint).toBeGreaterThan(20);
    }
  });

  it('finds the reason only in the comment block touching the entry', () => {
    const parsed = ignoreEntries('# header\n\n# why\n' + 'a'.repeat(40) + ':f.ts:rule:1\n');
    expect(parsed).toEqual([{ fingerprint: `${'a'.repeat(40)}:f.ts:rule:1`, reason: ['# why'] }]);
  });
});
